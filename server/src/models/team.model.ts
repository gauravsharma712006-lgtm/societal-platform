import mongoose, { Document, Schema } from 'mongoose';

export const TEAM_STATUSES = [
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
] as const;

export type TeamStatus =
    (typeof TEAM_STATUSES)[number];

export interface ITeam extends Document {
    name: string;
    description: string;

    challenge: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;

    status: TeamStatus;

    createdAt: Date;
    updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000,
        },

        challenge: {
            type: Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        status: {
            type: String,
            enum: TEAM_STATUSES,
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    }
);

export const Team = mongoose.model<ITeam>(
    'Team',
    teamSchema
);