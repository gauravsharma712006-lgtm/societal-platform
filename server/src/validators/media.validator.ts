import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

const ALLOWED_MEDIA_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;

export const createUploadUrlSchema = z.object({
   problemId: mongoObjectIdSchema,

    fileName: z
        .string()
        .trim()
        .min(1)
        .max(255),

    contentType: z.enum(ALLOWED_MEDIA_TYPES),

    size: z
        .number()
        .int()
        .positive()
        .max(10 * 1024 * 1024),
});



export const createDownloadUrlSchema = z.object({
  problemId: mongoObjectIdSchema,
  key: z.string().trim().min(1).max(500),
});




export type CreateUploadUrlInput = z.infer<
    typeof createUploadUrlSchema
>;

