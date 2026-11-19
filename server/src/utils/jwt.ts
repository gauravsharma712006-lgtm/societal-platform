
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authTokenPayloadSchema } from '../validators/jwt.validator';

export interface AuthTokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  const payload = authTokenPayloadSchema.parse({
    userId,
    role,
  });

  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TOKEN_TTL_SECONDS,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
};
