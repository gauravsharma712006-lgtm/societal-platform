import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
  role: string;
}

import { env } from '../config/env';

export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  const payload: AuthTokenPayload = {
    userId,
    role,
  };

 return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
});
}