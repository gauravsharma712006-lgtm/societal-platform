import { z } from 'zod';

export const authTokenPayloadSchema = z.object({
    userId: z.string().min(1),
    role: z.string().min(1),
});

export type AuthTokenPayload = z.infer<
    typeof authTokenPayloadSchema
>;