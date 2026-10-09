import { z } from 'zod';

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

    challenge: z
        .string()
        .min(1),
});


export const teamIdSchema = z.object({
    teamId: z.string().min(1),
});