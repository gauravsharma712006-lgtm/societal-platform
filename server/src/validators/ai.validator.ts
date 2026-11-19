
import { z } from 'zod';

import { PROBLEM_CATEGORIES } from '../constants/problem';

export const improveProblemSchema = z.object({
  title: z.string().trim().max(150).default(''),
  description: z
    .string()
    .trim()
    .min(20, 'Please provide at least 20 characters describing the problem.')
    .max(5000),
  category: z.enum(PROBLEM_CATEGORIES).optional(),
});
