import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';



function getObjectSchemaKeys(
    schema: z.ZodType
): string[] {
    if (schema instanceof z.ZodObject) {
        return Object.keys(schema.shape);
    }

    return [];
}

export const validate = (schema: ZodSchema) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const result = schema.safeParse({
            ...req.body,
            ...req.params,
        });

        if (!result.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }

        const parsed = result.data as Record<string, unknown>;

const schemaKeys = getObjectSchemaKeys(schema);

const paramKeys = new Set(Object.keys(req.params));

// If this schema validates only route parameters,
// do not modify the request body.
const isParamsOnlySchema =
    schemaKeys.length > 0 &&
    schemaKeys.every((key) => paramKeys.has(key));

if (isParamsOnlySchema) {
    for (const key of schemaKeys) {
        if (key in parsed && typeof parsed[key] === 'string') {
            req.params[key] = parsed[key];
        }
    }
} else {
    const validatedBody: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(parsed)) {
        if (paramKeys.has(key)) {
            if (typeof value === 'string') {
                req.params[key] = value;
            }
        } else {
            validatedBody[key] = value;
        }
    }

    // Use only Zod's parsed data. Do not merge the original
    // body back in, because it may contain unknown fields.
    req.body = validatedBody;
}

next();
    };
};
