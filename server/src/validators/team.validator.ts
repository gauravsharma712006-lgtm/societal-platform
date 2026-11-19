
import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

export const createTeamSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3)
        .max(100),

    description: z
        .string()
        .trim()
        .min(10)
        .max(1000),

    challenge: mongoObjectIdSchema,
});

export const teamIdSchema = z.object({
    teamId: mongoObjectIdSchema,
});
