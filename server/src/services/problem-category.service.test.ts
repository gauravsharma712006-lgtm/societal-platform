
import { Types } from 'mongoose';

import { Category } from '../models/category.model';
import { Problem } from '../models/problem.model';
import { createProblem } from './problem.service';

import {
    createProblemSchema,
    type CreateProblemInput,
} from '../validators/problem.validator';

const ROOT_ID = '507f1f77bcf86cd799439011';
const CHILD_ID = '507f1f77bcf86cd799439012';
const MISSING_ID = '507f1f77bcf86cd799439099';
const USER_ID = '507f1f77bcf86cd799439013';

const validInput: CreateProblemInput = {
    title: 'Broken water supply pipe',
    description:
        'A damaged water pipe is leaking near the community park.',
    categoryId: CHILD_ID,
    location: {
        address: 'Community Park Road',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
    },
    priority: 'MEDIUM',
};

interface MockCategory {
    slug: string;
    parentId: Types.ObjectId | null;
    isActive: boolean;
    isSelectable: boolean;
}

const makeCategory = (
    slug: string,
    parentId: string | null,
    overrides: Partial<MockCategory> = {}
): MockCategory => ({
    slug,
    parentId: parentId
        ? new Types.ObjectId(parentId)
        : null,
    isActive: true,
    isSelectable: true,
    ...overrides,
});

const mockCategories = (
    records: Record<string, MockCategory>
) => {
    jest.spyOn(Category, 'findById').mockImplementation(
        ((id: unknown) => ({
            select: () => ({
                lean: async () =>
                    records[String(id)] ?? null,
            }),
        })) as never
    );
};

describe('Dynamic Problem Categories', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Request validation', () => {
        it('accepts a valid categoryId', () => {
            expect(
                createProblemSchema.safeParse(validInput)
                    .success
            ).toBe(true);
        });

        it('rejects a malformed categoryId', () => {
            const result = createProblemSchema.safeParse({
                ...validInput,
                categoryId: 'invalid-id',
            });

            expect(result.success).toBe(false);
        });

        it('requires a category', () => {
            const result = createProblemSchema.safeParse({
                ...validInput,
                categoryId: undefined,
            });

            expect(result.success).toBe(false);
        });

        it('rejects both category formats together', () => {
            const result = createProblemSchema.safeParse({
                ...validInput,
                category: 'INFRASTRUCTURE',
            });

            expect(result.success).toBe(false);
        });
    });

    describe('Database category validation', () => {
        let createSpy: jest.SpyInstance;

        beforeEach(() => {
            createSpy = jest
                .spyOn(Problem, 'create')
                .mockResolvedValue({} as never);
        });

        it('accepts an active selectable subcategory', async () => {
            mockCategories({
                [CHILD_ID]: makeCategory(
                    'WATER_SUPPLY',
                    ROOT_ID
                ),
                [ROOT_ID]: makeCategory(
                    'WATER',
                    null
                ),
            });

            await createProblem(validInput, USER_ID);

            expect(createSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    categoryId: new Types.ObjectId(CHILD_ID),
                    category: null,
                    reportedBy: USER_ID,
                })
            );
        });

        it('rejects a category that does not exist', async () => {
            mockCategories({});

            await expect(
                createProblem(
                    {
                        ...validInput,
                        categoryId: MISSING_ID,
                    },
                    USER_ID
                )
            ).rejects.toThrow('PROBLEM_CATEGORY_NOT_FOUND');

            expect(createSpy).not.toHaveBeenCalled();
        });

        it('rejects an inactive category', async () => {
            mockCategories({
                [CHILD_ID]: makeCategory(
                    'WATER_SUPPLY',
                    ROOT_ID,
                    { isActive: false }
                ),
            });

            await expect(
                createProblem(validInput, USER_ID)
            ).rejects.toThrow('PROBLEM_CATEGORY_INACTIVE');

            expect(createSpy).not.toHaveBeenCalled();
        });

        it('rejects a non-selectable category', async () => {
            mockCategories({
                [CHILD_ID]: makeCategory(
                    'WATER_SUPPLY',
                    ROOT_ID,
                    { isSelectable: false }
                ),
            });

            await expect(
                createProblem(validInput, USER_ID)
            ).rejects.toThrow(
                'PROBLEM_CATEGORY_NOT_SELECTABLE'
            );

            expect(createSpy).not.toHaveBeenCalled();
        });

        it('rejects an inactive parent category', async () => {
            mockCategories({
                [CHILD_ID]: makeCategory(
                    'WATER_SUPPLY',
                    ROOT_ID
                ),
                [ROOT_ID]: makeCategory(
                    'WATER',
                    null,
                    { isActive: false }
                ),
            });

            await expect(
                createProblem(validInput, USER_ID)
            ).rejects.toThrow(
                'PROBLEM_CATEGORY_PARENT_INACTIVE'
            );

            expect(createSpy).not.toHaveBeenCalled();
        });

        it('rejects a circular hierarchy', async () => {
            mockCategories({
                [CHILD_ID]: makeCategory(
                    'WATER_SUPPLY',
                    ROOT_ID
                ),
                [ROOT_ID]: makeCategory(
                    'WATER',
                    CHILD_ID
                ),
            });

            await expect(
                createProblem(validInput, USER_ID)
            ).rejects.toThrow(
                'PROBLEM_CATEGORY_HIERARCHY_INVALID'
            );

            expect(createSpy).not.toHaveBeenCalled();
        });
    });
});
