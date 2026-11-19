/**
 * Idempotent Category Seed Script
 *
 * Creates the initial hierarchical category structure for the Societal Platform.
 * Running this script multiple times will not create duplicate categories.
 *
 * Category hierarchy (from roadmap Section 4.3):
 *
 *   INFRASTRUCTURE
 *     ROADS
 *     STREETLIGHTS
 *     BRIDGES
 *
 *   WATER
 *     WATER_SUPPLY
 *     WATER_QUALITY
 *     DRAINAGE
 *
 *   HEALTH
 *     HOSPITALS
 *     PUBLIC_HEALTH
 *
 *   EDUCATION
 *     SCHOOLS
 *     COLLEGES
 *
 *   ENVIRONMENT
 *     AIR_POLLUTION
 *     WATER_POLLUTION
 *     WASTE_MANAGEMENT
 *
 *   TRANSPORTATION
 *     PUBLIC_TRANSPORT
 *     TRAFFIC
 *     ROAD_SAFETY
 *
 *   SANITATION
 *     GARBAGE_COLLECTION
 *     PUBLIC_TOILETS
 */

import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Category } from '../models/category.model';

interface CategorySeed {
    name: string;
    slug: string;
    description: string;
    parentId?: string;
    isActive: boolean;
    isSelectable: boolean;
    sortOrder: number;
}


const categories: CategorySeed[] = [  // Root categories
  {
    name: 'INFRASTRUCTURE',
    slug: 'INFRASTRUCTURE',
    description: 'Public infrastructure',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'WATER',
    slug: 'WATER',
    description: 'Water-related issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },
  {
    name: 'HEALTH',
    slug: 'HEALTH',
    description: 'Health-related issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 3,
  },
  {
    name: 'EDUCATION',
    slug: 'EDUCATION',
    description: 'Education-related issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 4,
  },
  {
    name: 'ENVIRONMENT',
    slug: 'ENVIRONMENT',
    description: 'Environmental issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 5,
  },
  {
    name: 'TRANSPORTATION',
    slug: 'TRANSPORTATION',
    description: 'Transportation issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 6,
  },
  {
    name: 'SANITATION',
    slug: 'SANITATION',
    description: 'Sanitation issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 7,
  },
  {
    name: 'OTHER',
    slug: 'OTHER',
    description: 'Problems that do not fit other categories',
    isActive: true,
    isSelectable: true,
    sortOrder: 8,
  },

  // Subcategories under INFRASTRUCTURE
  {
    name: 'ROADS',
    slug: 'ROADS',
    parentId: 'INFRASTRUCTURE',
    description: 'Road infrastructure issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'STREETLIGHTS',
    slug: 'STREETLIGHTS',
    parentId: 'INFRASTRUCTURE',
    description: 'Street lighting issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },
  {
    name: 'BRIDGES',
    slug: 'BRIDGES',
    parentId: 'INFRASTRUCTURE',
    description: 'Bridge infrastructure issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 3,
  },

  // Subcategories under WATER
  {
    name: 'WATER_SUPPLY',
    slug: 'WATER_SUPPLY',
    parentId: 'WATER',
    description: 'Water supply issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'WATER_QUALITY',
    slug: 'WATER_QUALITY',
    parentId: 'WATER',
    description: 'Water quality issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },
  {
    name: 'DRAINAGE',
    slug: 'DRAINAGE',
    parentId: 'WATER',
    description: 'Drainage and sewage issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 3,
  },

  // Subcategories under HEALTH
  {
    name: 'HOSPITALS',
    slug: 'HOSPITALS',
    parentId: 'HEALTH',
    description: 'Hospital and medical facility issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'PUBLIC_HEALTH',
    slug: 'PUBLIC_HEALTH',
    parentId: 'HEALTH',
    description: 'Public health concerns',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },

  // Subcategories under EDUCATION
  {
    name: 'SCHOOLS',
    slug: 'SCHOOLS',
    parentId: 'EDUCATION',
    description: 'School-related issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'COLLEGES',
    slug: 'COLLEGES',
    parentId: 'EDUCATION',
    description: 'College and university issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },

  // Subcategories under ENVIRONMENT
  {
    name: 'AIR_POLLUTION',
    slug: 'AIR_POLLUTION',
    parentId: 'ENVIRONMENT',
    description: 'Air pollution issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'WATER_POLLUTION',
    slug: 'WATER_POLLUTION',
    parentId: 'ENVIRONMENT',
    description: 'Water pollution issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },
  {
    name: 'WASTE_MANAGEMENT',
    slug: 'WASTE_MANAGEMENT',
    parentId: 'ENVIRONMENT',
    description: 'Waste management issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 3,
  },

  // Subcategories under TRANSPORTATION
  {
    name: 'PUBLIC_TRANSPORT',
    slug: 'PUBLIC_TRANSPORT',
    parentId: 'TRANSPORTATION',
    description: 'Public transportation issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'TRAFFIC',
    slug: 'TRAFFIC',
    parentId: 'TRANSPORTATION',
    description: 'Traffic congestion issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },
  {
    name: 'ROAD_SAFETY',
    slug: 'ROAD_SAFETY',
    parentId: 'TRANSPORTATION',
    description: 'Road safety issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 3,
  },

  // Subcategories under SANITATION
  {
    name: 'GARBAGE_COLLECTION',
    slug: 'GARBAGE_COLLECTION',
    parentId: 'SANITATION',
    description: 'Garbage collection issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 1,
  },
  {
    name: 'PUBLIC_TOILETS',
    slug: 'PUBLIC_TOILETS',
    parentId: 'SANITATION',
    description: 'Public toilet issues',
    isActive: true,
    isSelectable: true,
    sortOrder: 2,
  },
];


async function seedCategories(): Promise<void> {
    try {
        await connectDatabase();

        // Create model-defined indexes, even if
        // automatic index creation is disabled.
        await Category.createIndexes();

        const indexes = await Category.collection.indexes();

        console.log(
            'Category indexes:',
            indexes.map((index) => index.name)
        );

        const slugToId = new Map<
            string,
            mongoose.Types.ObjectId
        >();

        let createdRoots = 0;
        let createdSubcategories = 0;

        const upsertCategory = async (
            category: CategorySeed,
            parentId: mongoose.Types.ObjectId | null
        ) => {
            // Insert only if this slug doesn't exist.
            // Never overwrite an existing category.
            const result = await Category.updateOne(
                { slug: category.slug },
                {
                    $setOnInsert: {
                        name: category.name,
                        slug: category.slug,
                        description: category.description,
                        parentId,
                        isActive: category.isActive,
                        isSelectable: category.isSelectable,
                        sortOrder: category.sortOrder,
                    },
                },
                {
                    upsert: true,
                    runValidators: true,
                }
            );

            const savedCategory = await Category.findOne({
                slug: category.slug,
            });

            if (!savedCategory) {
                throw new Error(
                    `Failed to load category: ${category.slug}`
                );
            }

            // Protect against an existing slug being
            // associated with the wrong parent.
            const actualParent =
                savedCategory.parentId?.toString() ?? null;

            const expectedParent =
                parentId?.toString() ?? null;

            if (actualParent !== expectedParent) {
                throw new Error(
                    `Parent conflict for category: ${category.slug}`
                );
            }

            return {
                category: savedCategory,
                created: result.upsertedCount === 1,
            };
        };

        // =====================================
        // Step 1: Seed root categories
        // =====================================

        const rootCategories = categories.filter(
            (category) => !category.parentId
        );

        for (const root of rootCategories) {
            const result = await upsertCategory(
                root,
                null
            );

            slugToId.set(
                root.slug,
                result.category._id
            );

            if (result.created) {
                createdRoots++;
            }
        }

        // =====================================
        // Step 2: Seed subcategories
        // =====================================

        const subcategories = categories.filter(
            (category) => Boolean(category.parentId)
        );

        for (const subcategory of subcategories) {
            const parentSlug = subcategory.parentId;

            if (!parentSlug) {
                throw new Error(
                    `Missing parent for ${subcategory.slug}`
                );
            }

            const parentId = slugToId.get(parentSlug);

            if (!parentId) {
                throw new Error(
                    `Parent category "${parentSlug}" not found for "${subcategory.slug}"`
                );
            }

            const result = await upsertCategory(
                subcategory,
                parentId
            );

            slugToId.set(
                subcategory.slug,
                result.category._id
            );

            if (result.created) {
                createdSubcategories++;
            }
        }

        // =====================================
        // Step 3: Verify database results
        // =====================================

        const totalCategories = await Category.countDocuments();

        console.log('\nCategory seeding completed.');

        console.log({
            newRoots: createdRoots,
            newSubcategories: createdSubcategories,
            newlyCreated:
                createdRoots + createdSubcategories,
            totalCategories,
        });

    } catch (error) {
        console.error('Category seeding failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

void seedCategories();


