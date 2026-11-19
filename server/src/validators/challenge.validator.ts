import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

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

    problem: mongoObjectIdSchema,

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



export const challengeIdParamSchema = z.object({
    challengeId: mongoObjectIdSchema,
});






export const updateChallengeSchema = z.object({
    title: z.string().trim().min(5).max(150).optional(),
    description: z.string().trim().min(20).max(5000).optional(),
    deadline: z.coerce
        .date()
        .refine(
            (date) => date.getTime() > Date.now(),
            { message: 'Deadline must be in the future' }
        )
        .optional(),
    skills: z.array(z.string().trim().min(1).max(100)).optional(),
    eligibility: z.string().trim().min(5).max(1000).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
);
