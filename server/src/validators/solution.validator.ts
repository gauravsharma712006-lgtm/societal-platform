
import { z } from 'zod';

export const createSolutionSchema = z.object({
    challenge: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid challenge ID'
    ),

    team: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid team ID'
    ),

    title: z.string().trim().min(5).max(150),
    description: z.string().trim().min(20).max(5000),
    approach: z.string().trim().min(20).max(5000),

    estimatedCost: z.coerce.number().min(0).optional(),

    estimatedCompletionDate: z.coerce.date().optional(),
});

export const solutionIdSchema = z.object({
    solutionId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid solution ID'
    ),
});

export const reviewSolutionSchema = z.object({
    solutionId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid solution ID'
    ),

    reviewStatus: z.enum([
        'APPROVED',
        'REJECTED',
        'REVISION_REQUESTED',
    ]),

    reviewNote: z.string().trim().max(2000).optional(),
});

export const updateImplementationStatusSchema = z.object({
    solutionId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid solution ID'
    ),

    implementationStatus: z.enum([
        'NOT_STARTED',
        'IN_PROGRESS',
        'ON_HOLD',
        'COMPLETED',
    ]),
});

export const createMilestoneSchema = z.object({
    solutionId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid solution ID'
    ),

    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(2000).optional(),
    dueDate: z.coerce.date().optional(),
});

export const updateMilestoneSchema = z.object({
    solutionId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid solution ID'
    ),

    milestoneId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid milestone ID'
    ),

    status: z.enum([
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
    ]),
});


export const recordImpactSchema = z.object({
    solutionId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Invalid solution ID'
    ),

    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(1000).optional(),
    unit: z.string().trim().min(1).max(50),

    baselineValue: z.number().finite().optional(),
    measuredValue: z.number().finite().optional(),

    measuredAt: z.coerce.date()
        .refine(
            (date) => date.getTime() <= Date.now(),
            'Measurement date cannot be in the future'
        )
        .optional(),

    notes: z.string().trim().max(2000).optional(),

    evidenceKeys: z.array(
        z.string().trim().min(1).max(1024)
    )
        .max(20)
        .refine(
            (keys) => new Set(keys).size === keys.length,
            'Evidence keys must be unique'
        )
        .optional(),
});


export const createSolutionEvidenceUploadSchema = z.object({
    solutionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid solution ID'),
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum([
        'image/jpeg',
        'image/png',
        'image/webp',
    ]),
    size: z.number().int().min(1).max(10 * 1024 * 1024),
});

export const attachSolutionEvidenceSchema = z.object({
    solutionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid solution ID'),
    key: z.string().trim().min(1).max(1024),
    originalName: z.string().trim().min(1).max(255),
    contentType: z.enum([
        'image/jpeg',
        'image/png',
        'image/webp',
    ]),
    size: z.number().int().min(1).max(10 * 1024 * 1024),
});

export const downloadSolutionEvidenceSchema = z.object({
    solutionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid solution ID'),
    key: z.string().trim().min(1).max(1024),
});