
import mongoose, { Document, Schema, model } from 'mongoose';

import {
    PROBLEM_CATEGORIES,
    PROBLEM_PRIORITIES,
    PROBLEM_STATUSES,
    ProblemCategory,
    ProblemPriority,
    ProblemStatus,
} from '../constants/problem';

// ==========================================
// Evidence Request Interface
// ==========================================

export interface IEvidenceRequest {
    _id?: mongoose.Types.ObjectId;
    message: string;
    requestedBy: mongoose.Types.ObjectId;
    status: 'PENDING' | 'RESPONDED';
    requestedAt: Date;
    respondedAt?: Date;
    responseMediaKeys: string[];
}

// ==========================================
// Problem Interface
// ==========================================

export interface IProblem extends Document {
    title: string;
    description: string;

    // Legacy category (temporary compatibility)
    category: ProblemCategory | null;

    // New dynamic category reference
    categoryId: mongoose.Types.ObjectId | null;

    location: {
        address: string;
        city: string;
        state: string;
        coordinates?: {
            type: 'Point';
            coordinates: [number, number]; // [longitude, latitude]
        };
    };

    status: ProblemStatus;
    priority: ProblemPriority;

    reportedBy: mongoose.Types.ObjectId;

    media: {
        key: string;
        originalName: string;
        contentType: string;
        size: number;
    }[];

    history: {
        action:
            | 'STATUS_CHANGED'
            | 'PRIORITY_CHANGED'
            | 'EVIDENCE_REQUESTED';
        from: string;
        to: string;
        changedBy: mongoose.Types.ObjectId;
        reason?: string;
    }[];

    evidenceRequests: IEvidenceRequest[];

    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// Evidence Request Schema
// ==========================================

const evidenceRequestSchema = new Schema<IEvidenceRequest>(
    {
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 1000,
        },

        requestedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        status: {
            type: String,
            enum: ['PENDING', 'RESPONDED'],
            default: 'PENDING',
            required: true,
        },

        requestedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },

        respondedAt: {
            type: Date,
        },

        responseMediaKeys: {
            type: [String],
            default: [],
        },
    },
    {
        _id: true,
    }
);

// ==========================================
// Problem History Schema
// ==========================================

const problemHistorySchema = new Schema(
    {
        action: {
            type: String,
            enum: [
                'STATUS_CHANGED',
                'PRIORITY_CHANGED',
                'EVIDENCE_REQUESTED',
            ],
            required: true,
        },

        from: {
            type: String,
            required: true,
        },

        to: {
            type: String,
            required: true,
        },

        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
        _id: true,
    }
);

// ==========================================
// GeoJSON Coordinates Schema
// ==========================================

const coordinatesSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },

        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: (value: number[]) =>
                    Array.isArray(value) &&
                    value.length === 2,
                message:
                    'GeoJSON coordinates must contain longitude and latitude.',
            },
        },
    },
    {
        _id: false,
    }
);

// ==========================================
// Problem Schema
// ==========================================

const problemSchema = new Schema<IProblem>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 5000,
        },

        // Legacy category field
        category: {
            type: String,
            enum: PROBLEM_CATEGORIES,
            default: null,
        },

        // New dynamic category reference
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },

        location: {
            address: {
                type: String,
                required: true,
                trim: true,
            },

            city: {
                type: String,
                required: true,
                trim: true,
            },

            state: {
                type: String,
                required: true,
                trim: true,
            },

            coordinates: {
                type: coordinatesSchema,
                required: false,
            },
        },

        status: {
            type: String,
            enum: PROBLEM_STATUSES,
            default: 'REPORTED',
            required: true,
        },

        priority: {
            type: String,
            enum: PROBLEM_PRIORITIES,
            default: 'MEDIUM',
            required: true,
        },

        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        history: {
            type: [problemHistorySchema],
            default: [],
        },

        media: [
            {
                key: {
                    type: String,
                    required: true,
                },

                originalName: {
                    type: String,
                    required: true,
                },

                contentType: {
                    type: String,
                    required: true,
                },

                size: {
                    type: Number,
                    required: true,
                },
            },
        ],

        evidenceRequests: {
            type: [evidenceRequestSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// ==========================================
// Model Export
// ==========================================

export const Problem = model<IProblem>(
    'Problem',
    problemSchema
);
