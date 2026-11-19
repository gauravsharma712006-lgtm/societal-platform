
import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

const categorySlugSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(
        /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
        'Slug must contain uppercase letters, numbers and underscores only'
    );

export const createCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2)
        .max(100),

    slug: categorySlugSchema,

    description: z
        .string()
        .trim()
        .max(500)
        .optional(),

    parentId: mongoObjectIdSchema
        .nullable()
        .optional(),

    isActive: z.boolean().optional(),

    isSelectable: z.boolean().optional(),

    sortOrder: z
        .number()
        .int()
        .min(0)
        .optional(),
});

export const updateCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

    description: z
        .string()
        .trim()
        .max(500)
        .optional(),

    isSelectable: z.boolean().optional(),

    sortOrder: z
        .number()
        .int()
        .min(0)
        .optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided for update',
    }
);

export const moveCategorySchema = z.object({
    parentId: mongoObjectIdSchema.nullable(),
});

export const updateCategoryStatusSchema = z.object({
    isActive: z.boolean(),
});

export const categoryIdParamSchema = z.object({
    categoryId: mongoObjectIdSchema,
});
