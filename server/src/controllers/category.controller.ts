
import { Request, Response } from 'express';

import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    moveCategory,
    updateCategoryStatus,
} from '../services/category.service';

const handleCategoryError = (
    error: unknown,
    res: Response,
    operation: string
): void => {
    if (error instanceof Error) {
        const errors: Record<
            string,
            { status: number; message: string }
        > = {
            CATEGORY_NOT_FOUND: {
                status: 404,
                message: 'Category not found',
            },
            CATEGORY_PARENT_NOT_FOUND: {
                status: 404,
                message: 'Parent category not found',
            },
            CATEGORY_PARENT_INACTIVE: {
                status: 400,
                message: 'Parent category is inactive',
            },
            CATEGORY_SLUG_ALREADY_EXISTS: {
                status: 409,
                message: 'A category with this slug already exists',
            },
            CATEGORY_CIRCULAR_REFERENCE: {
                status: 400,
                message: 'This operation would create a circular category hierarchy',
            },
            CATEGORY_HAS_ACTIVE_DESCENDANTS: {
                status: 400,
                message: 'Deactivate all active child categories first',
            },
            CATEGORY_MAX_DEPTH_EXCEEDED: {
                status: 400,
                message: 'Category hierarchy cannot exceed 3 levels',
            },
            CATEGORY_HIERARCHY_CORRUPT: {
                status: 500,
                message: 'Category hierarchy data is inconsistent',
            },

            CATEGORY_NAME_ALREADY_EXISTS: {
                status: 409,
                message: 'A category with this name already exists under this parent',
            },
            CATEGORY_DUPLICATE_KEY: {
                status: 409,
                message: 'This category conflicts with an existing category',
            },
        };

        const knownError = errors[error.message];

        if (knownError) {
            res.status(knownError.status).json({
                status: 'error',
                message: knownError.message,
            });
            return;
        }
    }

    console.error(`${operation} error:`, error);

    res.status(500).json({
        status: 'error',
        message: `Failed to ${operation.toLowerCase()}`,
    });
};

export const createCategoryController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const category = await createCategory(req.body);

        res.status(201).json({
            status: 'success',
            data: { category },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Create category');
    }
};

export const getCategoriesController = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const categories = await getCategories();

        res.status(200).json({
            status: 'success',
            data: { categories },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Get categories');
    }
};

export const getAllCategoriesAdminController = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const categories = await getCategories(true);

        res.status(200).json({
            status: 'success',
            data: { categories },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Get categories');
    }
};

export const getCategoryByIdController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { categoryId } = req.params;

        const category = await getCategoryById(categoryId);

        if (!category.isActive) {
            res.status(404).json({
                status: 'error',
                message: 'Category not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: { category },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Get category');
    }
};

export const updateCategoryController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { categoryId } = req.params;

        const category = await updateCategory(
            categoryId,
            req.body
        );

        res.status(200).json({
            status: 'success',
            data: { category },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Update category');
    }
};

export const moveCategoryController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { categoryId } = req.params;
        const { parentId } = req.body;

        const category = await moveCategory(
            categoryId,
            parentId
        );

        res.status(200).json({
            status: 'success',
            data: { category },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Move category');
    }
};

export const updateCategoryStatusController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { categoryId } = req.params;
        const { isActive } = req.body;

        const category = await updateCategoryStatus(
            categoryId,
            isActive
        );

        res.status(200).json({
            status: 'success',
            data: { category },
        });
    } catch (error) {
        handleCategoryError(error, res, 'Update category status');
    }
};
