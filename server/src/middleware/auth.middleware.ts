
import {
  Request,
  Response,
  NextFunction,
} from 'express';

import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env';
import User from '../models/user.model';

import {
  AuthTokenPayload,
  authTokenPayloadSchema,
} from '../validators/jwt.validator';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.headers.authorization;
  delete req.user;

  if (!authorization) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
    return;
  }

  const [scheme, token, ...extraParts] =
    authorization.split(' ');

  if (
    scheme !== 'Bearer' ||
    !token ||
    token.length > 4096 ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ||
    extraParts.length > 0
  ) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid authorization header',
    });
    return;
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: env.JWT_ACCESS_TOKEN_TTL_SECONDS,
      ...(env.NODE_ENV === 'production' && {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }),
    });
  } catch {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
    return;
  }

  const result = authTokenPayloadSchema.extend({
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
  }).refine((claims) =>
    claims.iat <= Math.floor(Date.now() / 1000) + 30 &&
    claims.exp > claims.iat &&
    claims.exp - claims.iat <= env.JWT_ACCESS_TOKEN_TTL_SECONDS
  ).safeParse(decoded);

  if (!result.success) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token payload',
    });
    return;
  }

  try {
    const user = await User.findById(result.data.userId)
      .select('_id role isActive');

    if (!user || user.isActive === false ||
        !authTokenPayloadSchema.safeParse({ userId: user._id.toString(), role: user.role }).success) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
