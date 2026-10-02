import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthTokenPayload {
  userId: string;
  role: string;
}

export interface AuthenticatedRequest
  extends Request {
  user?: AuthTokenPayload;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return secret;
};

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });

      return;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid authorization header',
      });

      return;
    }

    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as AuthTokenPayload;

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};