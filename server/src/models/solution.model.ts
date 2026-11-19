
import mongoose, { Document, Schema, model } from 'mongoose';

export const SOLUTION_REVIEW_STATUSES = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REVISION_REQUESTED',
] as const;

export type SolutionReviewStatus =
    (typeof SOLUTION_REVIEW_STATUSES)[number];

export const SOLUTION_IMPLEMENTATION_STATUSES = [
    'NOT_STARTED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
] as const;

export type SolutionImplementationStatus =
    (typeof SOLUTION_IMPLEMENTATION_STATUSES)[number];

export const SOLUTION_HISTORY_ACTIONS = [
    'SUBMITTED',
    'REVIEWED',
    'REVISION_REQUESTED',
    'IMPLEMENTATION_STATUS_CHANGED',
    'MILESTONE_UPDATED',
    'IMPACT_RECORDED',
    'EVIDENCE_ADDED',
] as const;

export type SolutionHistoryAction =
    (typeof SOLUTION_HISTORY_ACTIONS)[number];

export interface ISolutionEvidence {
    key: string;
    originalName: string;
    contentType: string;
    size: number;
    uploadedAt: Date;
}

export interface ISolutionMilestone {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    dueDate?: Date;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    completedAt?: Date;
}

export interface ISolutionImpactIndicator {
    name: string;
    description?: string;
    unit: string;
    baselineValue?: number;
    measuredValue?: number;
    measuredAt?: Date;
    notes?: string;
    evidenceKeys: string[];
}

export interface ISolutionHistory {
    action: SolutionHistoryAction;
    from?: string;
    to?: string;
    changedBy: mongoose.Types.ObjectId;
    note?: string;
    changedAt: Date;
}

export interface ISolution extends Document {
    challenge: mongoose.Types.ObjectId;
    team: mongoose.Types.ObjectId;
    submittedBy: mongoose.Types.ObjectId;

    title: string;
    description: string;
    approach: string;
    estimatedCost?: number;
    estimatedCompletionDate?: Date;

    reviewStatus: SolutionReviewStatus;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewNote?: string;
    reviewedAt?: Date;

    implementationStatus: SolutionImplementationStatus;
    milestones: ISolutionMilestone[];

    impactIndicators: ISolutionImpactIndicator[];
    evidence: ISolutionEvidence[];
    history: ISolutionHistory[];

    createdAt: Date;
    updatedAt: Date;
}

const solutionEvidenceSchema = new Schema<ISolutionEvidence>(
    {
        key: {
            type: String,
            required: true,
            trim: true,
        },
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        contentType: {
            type: String,
            required: true,
            trim: true,
        },
        size: {
            type: Number,
            required: true,
            min: 1,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    { _id: true }
);

const solutionMilestoneSchema = new Schema<ISolutionMilestone>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        dueDate: Date,
        status: {
            type: String,
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            default: 'PENDING',
            required: true,
        },
        completedAt: Date,
    },
    { _id: true }
);

const solutionImpactIndicatorSchema =
    new Schema<ISolutionImpactIndicator>(
        {
            name: {
                type: String,
                required: true,
                trim: true,
                minlength: 2,
                maxlength: 150,
            },
            description: {
                type: String,
                trim: true,
                maxlength: 1000,
            },
            unit: {
                type: String,
                required: true,
                trim: true,
                maxlength: 50,
            },
            baselineValue: {
                type: Number,
            },
            measuredValue: {
                type: Number,
            },
            measuredAt: Date,
            notes: {
                type: String,
                trim: true,
                maxlength: 2000,
            },
            evidenceKeys: {
                type: [String],
                default: [],
            },
        },
        { _id: true }
    );

const solutionHistorySchema = new Schema<ISolutionHistory>(
    {
        action: {
            type: String,
            enum: SOLUTION_HISTORY_ACTIONS,
            required: true,
        },
        from: String,
        to: String,
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        changedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    { _id: true }
);

const solutionSchema = new Schema<ISolution>(
    {
        challenge: {
            type: Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true,
            index: true,
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
            index: true,
        },
        submittedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

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
        approach: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 5000,
        },
        estimatedCost: {
            type: Number,
            min: 0,
        },
        estimatedCompletionDate: Date,

        reviewStatus: {
            type: String,
            enum: SOLUTION_REVIEW_STATUSES,
            default: 'PENDING',
            required: true,
            index: true,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewNote: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        reviewedAt: Date,

        implementationStatus: {
            type: String,
            enum: SOLUTION_IMPLEMENTATION_STATUSES,
            default: 'NOT_STARTED',
            required: true,
        },
        milestones: {
            type: [solutionMilestoneSchema],
            default: [],
        },

        impactIndicators: {
            type: [solutionImpactIndicatorSchema],
            default: [],
        },
        evidence: {
            type: [solutionEvidenceSchema],
            default: [],
        },
        history: {
            type: [solutionHistorySchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

solutionSchema.index({
    challenge: 1,
    team: 1,
    createdAt: -1,
});

export const Solution = model<ISolution>(
    'Solution',
    solutionSchema
);
