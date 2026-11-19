
import { z } from 'zod';

export const mongoObjectIdSchema = z
    .string()
    .regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid MongoDB ObjectId'
    );
