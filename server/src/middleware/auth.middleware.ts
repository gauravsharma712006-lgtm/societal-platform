import {
  Request,
  Response,
  NextFunction,
} from 'express';

import jwt from 'jsonwebtoken';

import { env } from '../config/env';

import {
  AuthTokenPayload,
  authTokenPayloadSchema,
} from '../validators/jwt.validator';

export interface AuthenticatedRequest
  extends Request {
  user?: AuthTokenPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });

      return;
    }

    const [scheme, token] =
      authorization.split(' ');

    if (
      scheme !== 'Bearer' ||
      !token
    ) {
      res.status(401).json({
        status: 'error',
        message:
          'Invalid authorization header',
      });

      return;
    }

    const decoded = jwt.verify(
      token,
      env.JWT_SECRET
    );

    const result =
      authTokenPayloadSchema.safeParse(
        decoded
      );

    if (!result.success) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token payload',
      });

      return;
    }

    req.user = result.data;

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};