import mongoose, { Document, Schema } from 'mongoose';
import {
    CHALLENGE_STATUSES,
    ChallengeStatus,
} from '../constants/challenge';

export interface IChallenge extends Document {
    title: string;
    description: string;

    problem: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;

    status: ChallengeStatus;

    deadline: Date;

    skills: string[];

    eligibility: string;

    createdAt: Date;
    updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
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

        problem: {
            type: Schema.Types.ObjectId,
            ref: 'Problem',
            required: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        status: {
            type: String,
            enum: CHALLENGE_STATUSES,
            default: 'DRAFT',
        },

        deadline: {
            type: Date,
            required: true,
        },

        skills: {
            type: [String],
            default: [],
        },

        eligibility: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

export const Challenge = mongoose.model<IChallenge>(
    'Challenge',
    challengeSchema
);