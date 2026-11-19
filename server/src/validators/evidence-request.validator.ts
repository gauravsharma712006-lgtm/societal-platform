
import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

export const createEvidenceRequestSchema = z.object({
    problemId: mongoObjectIdSchema,
    message: z
        .string()
        .trim()
        .min(5, 'The evidence request must be at least 5 characters.')
        .max(1000, 'The evidence request cannot exceed 1000 characters.'),
});


export const respondToEvidenceRequestSchema = z.object({
    problemId: mongoObjectIdSchema,
    requestId: mongoObjectIdSchema,
    responseMediaKeys: z
        .array(z.string().min(1))
        .min(1, 'Please upload at least one evidence file.')
        .max(10, 'You can submit up to 10 evidence files at once.'),
});
