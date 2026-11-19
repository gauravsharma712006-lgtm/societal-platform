
import mongoose, { Schema } from 'mongoose';

export interface ICategory {
    name: string;
    slug: string;
    description?: string;
    parentId: mongoose.Types.ObjectId | null;
    isActive: boolean;
    isSelectable: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            immutable: true,
        },
        description: {
            type: String,
           
            trim: true,
            maxlength: 500,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isSelectable: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);



categorySchema.index(
    { slug: 1 },
    { unique: true }
);

categorySchema.index(
    { parentId: 1, name: 1 },
    {
        unique: true,
        collation: {
            locale: 'en',
            strength: 2,
        },
        name: 'unique_category_name_per_parent',
    }
);

categorySchema.index({
    parentId: 1,
    isActive: 1,
    sortOrder: 1,
});

export const Category = mongoose.model<ICategory>(
    'Category',
    categorySchema
);
