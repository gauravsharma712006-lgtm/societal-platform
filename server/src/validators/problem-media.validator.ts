import { z } from 'zod';

export const addProblemMediaSchema = z.object({
    key: z
        .string()
        .trim()
        .min(1)
        .max(500),

    originalName: z
        .string()
        .trim()
        .min(1)
        .max(255),

    contentType: z.enum([
        'image/jpeg',
        'image/png',
        'image/webp',
    ]),

    size: z
        .number()
        .int()
        .positive()
        .max(10 * 1024 * 1024),
});