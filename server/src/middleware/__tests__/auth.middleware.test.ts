
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { authenticate, AuthenticatedRequest } from '../auth.middleware';
import User from '../../models/user.model';

jest.mock('../../models/user.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

describe('authenticate middleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let status: jest.Mock;
  let json: jest.Mock;

  const secret = 'test-only-secret-for-jest';
  const userId = '507f1f77bcf86cd799439011';


const makeToken = (
  payload: Record<string, unknown> = {
    userId,
    role: 'USER',
  },
  signingSecret = secret,
  expiresIn?: SignOptions['expiresIn']
) =>
  jwt.sign(
    payload,
    signingSecret,
    { expiresIn: expiresIn || '1h' }
  );


beforeEach(() => {
  jest.clearAllMocks();

  req = {
    headers: {},
  };

  status = jest.fn().mockReturnThis();
  json = jest.fn();

  res = {
    status,
    json,
  };

  next = jest.fn();
});

  it('rejects requests without an authorization header', async () => {
    await authenticate(
      req as AuthenticatedRequest,
      res as Response,
      next
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('rejects invalid or expired tokens', async () => {
    req.headers = {
      authorization: `Bearer ${makeToken(
        { userId, role: 'USER' },
        secret,
        '-1s'
      )}`,
    };

    await authenticate(
      req as AuthenticatedRequest,
      res as Response,
      next
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects tokens when the user no longer exists', async () => {
    req.headers = {
      authorization: `Bearer ${makeToken()}`,
    };

    const select = jest.fn().mockResolvedValue(null);

    (User.findById as jest.Mock).mockReturnValue({ select });

    await authenticate(
      req as AuthenticatedRequest,
      res as Response,
      next
    );

    expect(User.findById).toHaveBeenCalledWith(userId);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('uses the current database role instead of a stale token role', async () => {
    req.headers = {
      authorization: `Bearer ${makeToken()}`,
    };

    const select = jest.fn().mockResolvedValue({
      _id: { toString: () => userId },
      role: 'ADMIN',
    });

    (User.findById as jest.Mock).mockReturnValue({ select });

    await authenticate(
      req as AuthenticatedRequest,
      res as Response,
      next
    );

    expect(User.findById).toHaveBeenCalledWith(userId);
    expect(select).toHaveBeenCalledWith('_id role isActive');
    expect(req.user).toEqual({
      userId,
      role: 'ADMIN',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
