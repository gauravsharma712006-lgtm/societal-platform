import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

export const createApplicationSchema = z.object({
challenge: mongoObjectIdSchema,        
        

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
            !data.reviewNote?.trim()
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['reviewNote'],
                message:
                    'Review note is required when rejecting an application',
            });
        }
    });

    
export const challengeApplicationsParamSchema = z.object({
    challengeId: mongoObjectIdSchema,
});

export const reviewApplicationParamSchema = z.object({
    applicationId: mongoObjectIdSchema,
});
