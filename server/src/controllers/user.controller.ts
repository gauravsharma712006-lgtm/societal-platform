import { Response } from 'express';

import {
  AuthenticatedRequest,
} from '../middleware/auth.middleware';

import {
  getStudents,
  updateUserProfile,
} from '../services/user.service';

import User from '../models/user.model';

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

    const user = await User.findById(
      req.user.userId
    ).select('-password');

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
    console.error(
      'Get current user error:',
      error
    );

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};


export const updateProfile = async (
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

    const user = await updateUserProfile(
      req.user.userId,
      req.body
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'USER_NOT_FOUND'
    ) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });

      return;
    }

    console.error(
      'Update profile error:',
      error
    );

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};



export const getStudentsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const students = await getStudents();

    res.status(200).json({
      status: 'success',
      data: {
        students,
      },
    });
  } catch (error) {
    console.error(
      'Get students error:',
      error
    );

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
