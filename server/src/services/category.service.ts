
import { z } from 'zod';
import { Types } from 'mongoose';

import { Category } from '../models/category.model';

import {
    createCategorySchema,
    updateCategorySchema,
} from '../validators/category.validator';

type CreateCategoryInput = z.infer<
    typeof createCategorySchema
>;

type UpdateCategoryInput = z.infer<
    typeof updateCategorySchema
>;

const MAX_CATEGORY_DEPTH = 3;

/**
 * Checks whether a MongoDB operation failed because
 * of a unique index violation.
 */
const isDuplicateKeyError = (
    error: unknown
): boolean => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
    );
};

const throwCategoryDuplicateError = (
    error: unknown
): never => {
    const keyPattern = (
        error as {
            keyPattern?: Record<string, unknown>;
        }
    ).keyPattern;

    if (keyPattern?.slug) {
        throw new Error(
            'CATEGORY_SLUG_ALREADY_EXISTS'
        );
    }

    if (keyPattern?.parentId || keyPattern?.name) {
        throw new Error(
            'CATEGORY_NAME_ALREADY_EXISTS'
        );
    }

    throw new Error('CATEGORY_DUPLICATE_KEY');
};

/**
 * Gets the depth of a category's parent chain.
 *
 * Root category depth = 1.
 * Returns 0 when parentId is null.
 *
 * Also validates that every ancestor exists and is active.
 */
const getActiveAncestorDepth = async (
    parentId: string | Types.ObjectId | null
): Promise<number> => {
    let currentId = parentId;
    let depth = 0;

    const visited = new Set<string>();

    while (currentId) {
        const id = currentId.toString();

        if (visited.has(id)) {
            throw new Error(
                'CATEGORY_HIERARCHY_CORRUPT'
            );
        }

        visited.add(id);

        const parent = await Category.findById(id)
            .select('_id parentId isActive')
            .lean();

        if (!parent) {
            throw new Error(
                'CATEGORY_PARENT_NOT_FOUND'
            );
        }

        if (!parent.isActive) {
            throw new Error(
                'CATEGORY_PARENT_INACTIVE'
            );
        }

        depth += 1;

        currentId = parent.parentId;
    }

    return depth;
};

/**
 * Retrieves all descendants of a category.
 *
 * Uses batched queries, one per hierarchy level.
 * Tracks visited IDs to prevent infinite traversal
 * if corrupted hierarchy data exists.
 */
const getDescendants = async (
    categoryId: Types.ObjectId
) => {
    const descendants: {
        _id: Types.ObjectId;
        isActive: boolean;
        depth: number;
    }[] = [];

    const visited = new Set<string>([
        categoryId.toString(),
    ]);

    let currentLevel: Types.ObjectId[] = [
        categoryId,
    ];

    let depth = 0;

    while (currentLevel.length > 0) {
        const children = await Category.find({
            parentId: {
                $in: currentLevel,
            },
        })
            .select('_id isActive')
            .lean();

        if (children.length === 0) {
            break;
        }

        depth += 1;

        for (const child of children) {
            const childId = child._id.toString();

            if (visited.has(childId)) {
                throw new Error(
                    'CATEGORY_HIERARCHY_CORRUPT'
                );
            }

            visited.add(childId);

            descendants.push({
                _id: child._id,
                isActive: child.isActive,
                depth,
            });
        }

        currentLevel = children.map(
            (child) => child._id
        );
    }

    return descendants;
};

/**
 * Creates a root category or subcategory.
 */
export const createCategory = async (
    data: CreateCategoryInput
) => {
    try {
        const parentDepth =
            await getActiveAncestorDepth(
                data.parentId ?? null
            );

        const newDepth = parentDepth + 1;

        if (newDepth > MAX_CATEGORY_DEPTH) {
            throw new Error(
                'CATEGORY_MAX_DEPTH_EXCEEDED'
            );
        }

        const category = await Category.create({
            ...data,
            parentId: data.parentId
                ? new Types.ObjectId(data.parentId)
                : null,
        });

        return category;
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.startsWith('CATEGORY_')
        ) {
            throw error;
        }

        if (isDuplicateKeyError(error)) {
            throwCategoryDuplicateError(error);
        }

        throw error;
    }
};

/**
 * Retrieves categories as a hierarchical tree.
 *
 * When includeInactive is false, inactive categories
 * and their entire branches are excluded.
 */
export const getCategories = async (
    includeInactive = false
) => {
    const categories = await Category.find()
        .sort({
            sortOrder: 1,
            name: 1,
        })
        .lean();

    type CategoryRecord = (typeof categories)[number];

    type CategoryNode = CategoryRecord & {
        children: CategoryNode[];
    };

    const nodes = new Map<string, CategoryNode>();

    for (const category of categories) {
        nodes.set(category._id.toString(), {
            ...category,
            children: [],
        });
    }

    const roots: CategoryNode[] = [];

    for (const node of nodes.values()) {
        const parentId = node.parentId?.toString();

        const parent = parentId
            ? nodes.get(parentId)
            : undefined;

        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    if (includeInactive) {
        return roots;
    }

    const filterActive = (
        node: CategoryNode
    ): CategoryNode | null => {
        if (!node.isActive) {
            return null;
        }

        return {
            ...node,
            children: node.children
                .map(filterActive)
                .filter(
                    (
                        child
                    ): child is CategoryNode =>
                        child !== null
                ),
        };
    };

    return roots
        .map(filterActive)
        .filter(
            (
                node
            ): node is CategoryNode =>
                node !== null
        );
};

/**
 * Retrieves a category by ID.
 */
export const getCategoryById = async (
    categoryId: string
) => {
    const category = await Category.findById(
        categoryId
    ).populate(
        'parentId',
        'name slug'
    );

    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    return category;
};

/**
 * Updates editable category properties.
 *
 * Slug and parentId cannot be changed here.
 * Use moveCategory for hierarchy changes.
 */
export const updateCategory = async (
    categoryId: string,
    data: UpdateCategoryInput
) => {
    const category = await Category.findById(
        categoryId
    );

    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    Object.assign(category, data);

    await category.save();

    return category;
};

/**
 * Moves a category to another parent.
 *
 * Passing null moves it to the root level.
 * The entire resulting subtree must remain within
 * the maximum hierarchy depth.
 */
export const moveCategory = async (
    categoryId: string,
    newParentId: string | null
) => {
    const category = await Category.findById(
        categoryId
    );

    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    if (
        newParentId &&
        category._id.toString() === newParentId
    ) {
        throw new Error(
            'CATEGORY_CIRCULAR_REFERENCE'
        );
    }

    const currentParentId =
        category.parentId?.toString() ?? null;

    if (currentParentId === newParentId) {
        return category;
    }

    // Validate the new parent's complete ancestor chain.
    const newParentDepth =
        await getActiveAncestorDepth(newParentId);

    // Check the complete subtree before moving it.
    const descendants = await getDescendants(
        category._id
    );

    const isDescendant = descendants.some(
        (descendant) =>
            descendant._id.toString() === newParentId
    );

    if (isDescendant) {
        throw new Error(
            'CATEGORY_CIRCULAR_REFERENCE'
        );
    }

    const deepestDescendantDepth =
        descendants.reduce(
            (maximum, descendant) =>
                Math.max(maximum, descendant.depth),
            0
        );

    const resultingDepth =
        newParentDepth +
        1 +
        deepestDescendantDepth;

    if (resultingDepth > MAX_CATEGORY_DEPTH) {
        throw new Error(
            'CATEGORY_MAX_DEPTH_EXCEEDED'
        );
    }

    category.parentId = newParentId
        ? new Types.ObjectId(newParentId)
        : null;

    await category.save();

    return category;
};

/**
 * Activates or deactivates a category.
 */
export const updateCategoryStatus = async (
    categoryId: string,
    isActive: boolean
) => {
    const category = await Category.findById(
        categoryId
    );

    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    if (category.isActive === isActive) {
        return category;
    }

    if (isActive) {
        // Every ancestor must exist and be active.
        await getActiveAncestorDepth(
            category.parentId
        );
    } else {
        // Prevent deactivation while active descendants exist.
        const descendants = await getDescendants(
            category._id
        );

        const hasActiveDescendants =
            descendants.some(
                (descendant) => descendant.isActive
            );

        if (hasActiveDescendants) {
            throw new Error(
                'CATEGORY_HAS_ACTIVE_DESCENDANTS'
            );
        }
    }

    category.isActive = isActive;

    try {
        await category.save();
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throwCategoryDuplicateError(error);
        }

        throw error;
    }
    return category;
};
