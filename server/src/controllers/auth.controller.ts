import { Request, Response } from 'express';
import { logError } from '../utils/log-error';

import {
  loginUser,
  registerUser,
} from '../services/auth.service';





export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    const isDuplicateEmail =
      error instanceof Error &&
      error.message === 'USER_ALREADY_EXISTS';

    const isMongoDuplicateKey =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000;

    if (isDuplicateEmail || isMongoDuplicateKey) {
      res.status(409).json({
        status: 'error',
        message: 'Unable to register with these details',
      });

      return;
    }

    logError('Registration failed', error);

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};


export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await loginUser(req.body);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: user,
    });

  } catch (error) {
    const isInvalidCredentials =
      error instanceof Error &&
      error.message === 'INVALID_CREDENTIALS';

    if (isInvalidCredentials) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    logError('Login failed', error);

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
}
