import { z } from 'zod';

import {
    PROBLEM_CATEGORIES,
    PROBLEM_PRIORITIES,
} from '../constants/problem';

export const createProblemSchema = z.object({
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

    category: z.enum(PROBLEM_CATEGORIES),

    location: z.object({
        address: z
            .string()
            .trim()
            .min(2)
            .max(300),

        city: z
            .string()
            .trim()
            .min(2)
            .max(100),

        state: z
            .string()
            .trim()
            .min(2)
            .max(100),

        coordinates: z
            .object({
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180),
            })
            .optional(),
    }),

    priority: z
        .enum(PROBLEM_PRIORITIES)
        .default('MEDIUM'),
});

export type CreateProblemInput = z.infer<
    typeof createProblemSchema
>;