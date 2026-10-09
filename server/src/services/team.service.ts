import mongoose from 'mongoose';

import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { Challenge } from '../models/challenge.model';

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

    const existingMembership =
        await TeamMember.findOne({
            user: new mongoose.Types.ObjectId(
                studentId
            ),
        }).populate('team');

    if (
        existingMembership &&
        existingMembership.team &&
        (
            existingMembership.team as any
        ).challenge.toString() === challengeId
    ) {
        throw new Error(
            'ALREADY_IN_TEAM_FOR_CHALLENGE'
        );
    }

    const team = await Team.create({
        name,
        description,
        challenge: challenge._id,
        createdBy:
            new mongoose.Types.ObjectId(studentId),
        status: 'ACTIVE',
    });

    await TeamMember.create({
        team: team._id,
        user:
            new mongoose.Types.ObjectId(studentId),
        role: 'LEADER',
    });

    return team;
};


export const getTeamById = async (
    teamId: string
) => {
    const team = await Team.findById(teamId)
        .populate('challenge')
        .populate('createdBy', 'name email role');

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    return team;
};



export const getTeamMembers = async (
    teamId: string
) => {
    const team = await Team.findById(teamId);

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    const members = await TeamMember.find({
        team: team._id,
    }).populate(
        'user',
        'name email role'
    );

    return members;
};