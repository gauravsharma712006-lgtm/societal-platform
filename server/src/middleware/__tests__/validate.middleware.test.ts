
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate.middleware';

describe('validate middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.MockedFunction<NextFunction>;
    let status: jest.Mock;
    let json: jest.Mock;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
        };

        status = jest.fn().mockReturnThis();
        json = jest.fn();

        res = {
            status,
            json,
        };

        next = jest.fn();
    });

    it('returns 400 when input is invalid', () => {
        req.body = { name: '' };

        const middleware = validate(
            z.object({
                name: z.string().min(2),
            })
        );

        middleware(
            req as Request,
            res as Response,
            next
        );

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'error',
                message: 'Validation failed',
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('applies transformations to the request body', () => {
        req.body = { email: '  USER@EXAMPLE.COM  ' };

        const middleware = validate(
            z.object({
                email: z.string().trim().toLowerCase().email(),
            })
        );

        middleware(
            req as Request,
            res as Response,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.body).toEqual({
            email: 'user@example.com',
        });
    });

    it('preserves route parameters while validating them', () => {
        req.body = { status: 'ACCEPTED' };
        req.params = { invitationId: 'a'.repeat(24) };

        const middleware = validate(
            z.object({
                status: z.enum(['ACCEPTED', 'REJECTED']),
                invitationId: z.string().regex(/^[0-9a-f]{24}$/),
            })
        );

        middleware(
            req as Request,
            res as Response,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.params?.invitationId).toBe('a'.repeat(24));
        expect(req.body).toEqual({
            status: 'ACCEPTED',
        });
    });


    
    it('applies schema defaults to missing fields', () => {
        req.body = { title: 'A valid title' };

        const middleware = validate(
            z.object({
                title: z.string(),
                skills: z.array(z.string()).default([]),
            })
        );

        middleware(
            req as Request,
            res as Response,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.body).toEqual({
            title: 'A valid title',
            skills: [],
        });
    });

    it('removes unknown fields from the validated body', () => {
        req.body = {
            name: 'Alex',
            role: 'ADMIN',
            unexpectedField: 'should not pass through',
        };

        const middleware = validate(
            z.object({
                name: z.string(),
            })
        );

        middleware(
            req as Request,
            res as Response,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.body).toEqual({
            name: 'Alex',
        });
    });

});
