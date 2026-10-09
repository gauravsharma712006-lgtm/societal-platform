import { z } from 'zod';

export const updateProblemPrioritySchema = z.object({
    priority: z.enum([
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
    ]),
});