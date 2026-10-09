import {
  Response,
  NextFunction,
} from 'express';

import { AuthenticatedRequest } from './auth.middleware';

import { UserRole } from '../models/user.model';

export const authorize = (
  ...allowedRoles: UserRole[]
) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });

      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });

      return;
    }

    next();
  };
};