
import { Router } from 'express';

import {
    createCategoryController,
    getCategoriesController,
    getAllCategoriesAdminController,
    getCategoryByIdController,
    updateCategoryController,
    moveCategoryController,
    updateCategoryStatusController,
} from '../controllers/category.controller';

import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';

import {
    createCategorySchema,
    updateCategorySchema,
    moveCategorySchema,
    updateCategoryStatusSchema,
    categoryIdParamSchema,
} from '../validators/category.validator';

const router = Router();

// Public: active category hierarchy
router.get('/', getCategoriesController);

// Admin: complete hierarchy, including inactive categories
router.get(
    '/admin',
    authenticate,
    authorize('ADMIN'),
    getAllCategoriesAdminController
);

// Admin: create category
router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    validate(createCategorySchema),
    createCategoryController
);

// Public: get an active category
router.get(
    '/:categoryId',
    validate(categoryIdParamSchema),
    getCategoryByIdController
);

// Admin: move category to another parent
router.patch(
    '/:categoryId/move',
    authenticate,
    authorize('ADMIN'),
    validate(categoryIdParamSchema),
    validate(moveCategorySchema),
    moveCategoryController
);

// Admin: activate or deactivate category
router.patch(
    '/:categoryId/status',
    authenticate,
    authorize('ADMIN'),
    validate(categoryIdParamSchema),
    validate(updateCategoryStatusSchema),
    updateCategoryStatusController
);

// Admin: update category details
router.patch(
    '/:categoryId',
    authenticate,
    authorize('ADMIN'),
    validate(categoryIdParamSchema),
    validate(updateCategorySchema),
    updateCategoryController
);

export default router;
