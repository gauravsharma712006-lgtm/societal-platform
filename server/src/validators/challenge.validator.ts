import { z } from 'zod';

export const createChallengeSchema = z.object({
    title: z
        .string()
        .trim()
        .min(5)
        .max(150),

    description: z
        .string()
        .trim()
        .min(20)
        .max(5000),

    problem: z
        .string()
        .min(1),

    deadline: z
        .coerce
        .date()
        .refine(
            (date) => date.getTime() > Date.now(),
            {
                message:
                    'Deadline must be in the future',
            }
        ),

    skills: z
        .array(z.string().trim().min(1).max(100))
        .default([]),

    eligibility: z
        .string()
        .trim()
        .min(5)
        .max(1000),
});


export const updateChallengeStatusSchema = z.object({
    status: z.enum([
        'OPEN',
        'CLOSED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
    ]),
});




export const updateChallengeSchema = z.object({
    title: z
        .string()
        .trim()
        .min(5)
        .max(150)
        .optional(),

    description: z
        .string()
        .trim()
        .min(20)
        .max(5000)
        .optional(),

    deadline: z
        .coerce
        .date()
        .refine(
            (date) => date.getTime() > Date.now(),
            {
                message:
                    'Deadline must be in the future',
            }
        )
        .optional(),

    skills: z
        .array(
            z.string().trim().min(1).max(100)
        )
        .optional(),

    eligibility: z
        .string()
        .trim()
        .min(5)
        .max(1000)
        .optional(),
});