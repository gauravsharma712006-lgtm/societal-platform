import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
  role: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return secret;
};

export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  const payload: AuthTokenPayload = {
    userId,
    role,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '15m',
  });
};