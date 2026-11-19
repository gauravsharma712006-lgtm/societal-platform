import mongoose from 'mongoose';
import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { Challenge } from '../models/challenge.model';
import { Application } from '../models/application.model';






export const createTeam = async (
    name: string,
    description: string,
    challengeId: string,
    studentId: string
) => {


    const challenge =
        await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (challenge.status !== 'OPEN') {
        throw new Error('CHALLENGE_NOT_OPEN');
    }

    if (challenge.deadline.getTime() <= Date.now()) {
        throw new Error('CHALLENGE_DEADLINE_PASSED');
    }


    const acceptedApplication = await Application.findOne({
        challenge: challengeId,
        applicant: new mongoose.Types.ObjectId(studentId),
        status: 'ACCEPTED',
    });

    if (!acceptedApplication) {
        throw new Error('APPLICATION_NOT_ACCEPTED');
    }

    const existingMemberships =
        await TeamMember.find({
            user: new mongoose.Types.ObjectId(studentId),
        }).populate('team');

    if (
        existingMemberships.some((membership) =>
            membership.team && (
                membership.team as unknown as { challenge: mongoose.Types.ObjectId }
            ).challenge.toString() === challengeId
        )
    ) {
        throw new Error(
            'ALREADY_IN_TEAM_FOR_CHALLENGE'
        );
    }

    const session = await mongoose.startSession();

    let team: mongoose.Document | null = null;

    try {
        await session.withTransaction(async () => {
            const createdTeams = await Team.create(
                [
                    {
                        name,
                        description,
                        challenge: challenge._id,
                        createdBy:
                            new mongoose.Types.ObjectId(studentId),
                        status: 'ACTIVE',
                    },
                ],
                { session }
            );

            team = createdTeams[0];

            await TeamMember.create(
                [
                    {
                        team: team._id,
                        user:
                            new mongoose.Types.ObjectId(studentId),
                        role: 'LEADER',
                    },
                ],
                { session }
            );
        });

        if (!team) {
            throw new Error('TEAM_CREATION_FAILED');
        }

        return team;
    } finally {
        await session.endSession();
    }
};

export const getTeamById = async (
    teamId: string,
    userId: string,
    isAdmin = false
) => {
    const team = await Team.findById(teamId)
        .populate('challenge')
        .populate('createdBy', 'name email role');

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    if (!isAdmin) {
        const membership = await TeamMember.findOne({
            team: team._id,
            user: new mongoose.Types.ObjectId(userId),
        });

        if (!membership) {
            throw new Error('NOT_A_TEAM_MEMBER');
        }
    }

    return team;
};
export const getTeamMembers = async (
    teamId: string,
    userId: string,
    isAdmin = false
) => {
    const team = await Team.findById(teamId);

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    if (!isAdmin) {
        const membership = await TeamMember.findOne({
            team: team._id,
            user: new mongoose.Types.ObjectId(userId),
        });

        if (!membership) {
            throw new Error('NOT_A_TEAM_MEMBER');
        }
    }

    const members = await TeamMember.find({
        team: team._id,
    }).populate(
        'user',
        'name email role'
    );

    return members;
};
