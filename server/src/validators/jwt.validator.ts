
import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

export const authTokenPayloadSchema = z.object({
  userId: mongoObjectIdSchema,
  role: z.enum([
    'USER',
    'STUDENT',
    'UNIVERSITY',
    'MENTOR',
    'ORGANIZATION',
    'ADMIN',
  ]),
});

export type AuthTokenPayload = z.infer<
  typeof authTokenPayloadSchema
>;
