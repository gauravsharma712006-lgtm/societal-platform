import { Request, Response } from 'express';

import {
  loginUser,
  registerUser,
} from '../services/auth.service';


import { AuthenticatedRequest } from '../middleware/auth.middleware';

import User from '../models/user.model';


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
    if (
      error instanceof Error &&
      error.message === 'USER_ALREADY_EXISTS'
    ) {
      res.status(409).json({
        status: 'error',
        message: 'User with this email already exists',
      });

      return;
    }

    console.error('Registration error:', error);

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
    if (
      error instanceof Error &&
      error.message === 'INVALID_CREDENTIALS'
    ) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });

      return;
    }

    console.error('Login error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });

      return;
    }

    const user = await User.findById(req.user.userId).select(
      '-password'
    );

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });

      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};