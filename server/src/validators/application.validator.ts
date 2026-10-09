import { z } from 'zod';

export const createApplicationSchema = z.object({
    challenge: z
        .string()
        .min(1),

    motivation: z
        .string()
        .trim()
        .min(20)
        .max(2000),

    skills: z
        .array(
            z.string()
                .trim()
                .min(1)
                .max(100)
        )
        .default([]),
});




export const reviewApplicationSchema = z
    .object({
        status: z.enum([
            'ACCEPTED',
            'REJECTED',
        ]),

        reviewNote: z
            .string()
            .trim()
            .max(1000)
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (
            data.status === 'REJECTED' &&
            !data.reviewNote
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['reviewNote'],
                message:
                    'Review note is required when rejecting an application',
            });
        }
    });