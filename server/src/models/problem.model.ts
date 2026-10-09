import mongoose, { Document, Schema, model } from 'mongoose';

import {
    PROBLEM_CATEGORIES,
    PROBLEM_PRIORITIES,
    PROBLEM_STATUSES,
    ProblemCategory,
    ProblemPriority,
    ProblemStatus,
} from '../constants/problem';



export interface IProblem extends Document {
    title: string;
    description: string;
    category: ProblemCategory;

    location: {
        address: string;
        city: string;
        state: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };

    status: ProblemStatus;
    priority: ProblemPriority;

    reportedBy: Schema.Types.ObjectId;

    media: {
        key: string;
        originalName: string;
        contentType: string;
        size: number;
    }[];

    history: {
    action: 'STATUS_CHANGED' | 'PRIORITY_CHANGED';
    from: string;
    to: string;
changedBy: mongoose.Types.ObjectId;    reason?: string;

}[];

    createdAt: Date;
    updatedAt: Date;
}


const problemHistorySchema = new Schema(
    {
        action: {
            type: String,
            enum: [
                'STATUS_CHANGED',
                'PRIORITY_CHANGED',
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

        category: {
            type: String,
            enum: PROBLEM_CATEGORIES,
            required: true,
        },

        location: {
            address: {
                type: String,
                required: true,
                trim: true,
                maxlength: 300,
            },
            city: {
                type: String,
                required: true,
                trim: true,
                maxlength: 100,
            },
            state: {
                type: String,
                required: true,
                trim: true,
                maxlength: 100,
            },
            coordinates: {
                latitude: {
                    type: Number,
                },
                longitude: {
                    type: Number,
                },
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
    },


    {
        timestamps: true,
    }
);







export const Problem = model<IProblem>(
    'Problem',
    problemSchema
);
