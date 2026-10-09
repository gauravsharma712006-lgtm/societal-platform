import mongoose, {
    Document,
    Schema,
} from 'mongoose';

export const TEAM_INVITATION_STATUSES = [
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
] as const;

export type TeamInvitationStatus =
    (typeof TEAM_INVITATION_STATUSES)[number];

export interface ITeamInvitation
    extends Document {
    team: mongoose.Types.ObjectId;
    invitedUser: mongoose.Types.ObjectId;
    invitedBy: mongoose.Types.ObjectId;
    status: TeamInvitationStatus;
    respondedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const teamInvitationSchema =
    new Schema<ITeamInvitation>(
        {
            team: {
                type: Schema.Types.ObjectId,
                ref: 'Team',
                required: true,
            },

            invitedUser: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            invitedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            status: {
                type: String,
                enum: TEAM_INVITATION_STATUSES,
                default: 'PENDING',
            },

            respondedAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
        }
    );

export const TeamInvitation =
    mongoose.model<ITeamInvitation>(
        'TeamInvitation',
        teamInvitationSchema
    );