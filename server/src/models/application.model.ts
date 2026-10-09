import mongoose, { Document, Schema } from 'mongoose';

export const APPLICATION_STATUSES = [
    'PENDING',
    'ACCEPTED',
    'REJECTED',
] as const;

export type ApplicationStatus =
    (typeof APPLICATION_STATUSES)[number];

export interface IApplication extends Document {
    challenge: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;

    motivation: string;
    skills: string[];

    status: ApplicationStatus;

    reviewedBy?: mongoose.Types.ObjectId;
    reviewNote?: string;

    createdAt: Date;
    updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
    {
        challenge: {
            type: Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true,
        },

        applicant: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        motivation: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 2000,
        },

        skills: {
            type: [String],
            default: [],
        },

        status: {
            type: String,
            enum: APPLICATION_STATUSES,
            default: 'PENDING',
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },

        reviewNote: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

applicationSchema.index(
    { challenge: 1, applicant: 1 },
    { unique: true }
);

export const Application = mongoose.model<IApplication>(
    'Application',
    applicationSchema
);