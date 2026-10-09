import mongoose from 'mongoose';

import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import {
    TeamInvitation,
} from '../models/team-invitation.model';
import { Challenge } from '../models/challenge.model';
import User from '../models/user.model';

export const createTeamInvitation = async (
    teamId: string,
    invitedUserId: string,
    invitedByUserId: string
) => {
    const team = await Team.findById(teamId);

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    if (team.status !== 'ACTIVE') {
        throw new Error('TEAM_NOT_ACTIVE');
    }

    const challenge = await Challenge.findById(
        team.challenge
    );

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (challenge.status !== 'OPEN') {
        throw new Error('CHALLENGE_NOT_OPEN');
    }

    const invitedUser = await User.findById(
        invitedUserId
    );

    if (!invitedUser) {
        throw new Error('USER_NOT_FOUND');
    }

    if (invitedUser.role !== 'STUDENT') {
        throw new Error(
            'INVITED_USER_NOT_STUDENT'
        );
    }

    const leaderMembership =
        await TeamMember.findOne({
            team: team._id,
            user: new mongoose.Types.ObjectId(
                invitedByUserId
            ),
            role: 'LEADER',
        });

    if (!leaderMembership) {
        throw new Error(
            'ONLY_TEAM_LEADER_CAN_INVITE'
        );
    }

    const existingMembership =
        await TeamMember.findOne({
            team: team._id,
            user: new mongoose.Types.ObjectId(
                invitedUserId
            ),
        });

    if (existingMembership) {
        throw new Error(
            'USER_ALREADY_TEAM_MEMBER'
        );
    }

    const existingInvitation =
        await TeamInvitation.findOne({
            team: team._id,
            invitedUser:
                new mongoose.Types.ObjectId(
                    invitedUserId
                ),
            status: 'PENDING',
        });

    if (existingInvitation) {
        throw new Error(
            'INVITATION_ALREADY_PENDING'
        );
    }

    const invitation =
        await TeamInvitation.create({
            team: team._id,
            invitedUser:
                new mongoose.Types.ObjectId(
                    invitedUserId
                ),
            invitedBy:
                new mongoose.Types.ObjectId(
                    invitedByUserId
                ),
            status: 'PENDING',
        });

    return invitation;
};

export const respondToTeamInvitation = async (
    invitationId: string,
    studentId: string,
    status: 'ACCEPTED' | 'REJECTED'
) => {
    const invitation =
        await TeamInvitation.findById(
            invitationId
        );

    if (!invitation) {
        throw new Error(
            'INVITATION_NOT_FOUND'
        );
    }

    if (
        invitation.invitedUser.toString() !==
        studentId
    ) {
        throw new Error(
            'NOT_INVITED_STUDENT'
        );
    }

    if (invitation.status !== 'PENDING') {
        throw new Error(
            'INVITATION_ALREADY_RESPONDED'
        );
    }

    const team = await Team.findById(
        invitation.team
    );

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    if (team.status !== 'ACTIVE') {
        throw new Error('TEAM_NOT_ACTIVE');
    }

    const challenge = await Challenge.findById(
        team.challenge
    );

    if (!challenge) {
        throw new Error(
            'CHALLENGE_NOT_FOUND'
        );
    }

    if (challenge.status !== 'OPEN') {
        throw new Error(
            'CHALLENGE_NOT_OPEN'
        );
    }

    if (status === 'REJECTED') {
        invitation.status = 'REJECTED';
        invitation.respondedAt = new Date();

        await invitation.save();

        return invitation;
    }

    const existingMemberships =
        await TeamMember.find({
            user: new mongoose.Types.ObjectId(
                studentId
            ),
        }).populate('team');

    const alreadyInSameChallenge =
        existingMemberships.some(
            (membership) => {
                if (!membership.team) {
                    return false;
                }

                const populatedTeam =
                    membership.team as unknown as {
                        challenge:
                            mongoose.Types.ObjectId;
                    };

                return (
                    populatedTeam.challenge.toString() ===
                    team.challenge.toString()
                );
            }
        );

    if (alreadyInSameChallenge) {
        throw new Error(
            'ALREADY_IN_TEAM_FOR_CHALLENGE'
        );
    }

    await TeamMember.create({
        team: team._id,
        user: new mongoose.Types.ObjectId(
            studentId
        ),
        role: 'MEMBER',
    });

    invitation.status = 'ACCEPTED';
    invitation.respondedAt = new Date();

    await invitation.save();

    return invitation;
};





export const getMyTeamInvitations = async (
    studentId: string
) => {
    const invitations =
        await TeamInvitation.find({
            invitedUser:
                new mongoose.Types.ObjectId(
                    studentId
                ),
        })
            .populate(
                'team',
                'name description challenge status'
            )
            .populate(
                'invitedBy',
                'name email role'
            )
            .sort({ createdAt: -1 });

    return invitations;
};


export const getMyTeams = async (
    studentId: string
) => {
    const memberships =
        await TeamMember.find({
            user: new mongoose.Types.ObjectId(
                studentId
            ),
        }).populate({
            path: 'team',
            populate: [
                {
                    path: 'challenge',
                    select: 'title status deadline',
                },
                {
                    path: 'createdBy',
                    select: 'name email role',
                },
            ],
        });

    return memberships;
};