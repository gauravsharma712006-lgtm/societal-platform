import { z } from 'zod';

export const updateProblemStatusSchema = z.object({
    status: z.enum([
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
    ]),
    rejectionReason: z
        .string()
        .trim()
        .min(5)
        .max(1000)
        .optional(),
});