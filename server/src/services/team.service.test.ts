
import mongoose from 'mongoose';

import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { Challenge } from '../models/challenge.model';

import {
    createTeam,
    getTeamById,
    getTeamMembers,
} from './team.service';
import { Application } from '../models/application.model';

describe('Team service — creation', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const challengeId = '507f1f77bcf86cd799439011';
    const studentId = '507f191e810c19729de860ea';

    it('rejects when the challenge does not exist', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(null);

        await expect(
            createTeam(
                'Community Helpers',
                'A team working to improve our community.',
                challengeId,
                studentId
            )
        ).rejects.toThrow('CHALLENGE_NOT_FOUND');
    });

    it('rejects when the challenge is not open', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
                status: 'CLOSED',
            } as never);

        await expect(
            createTeam(
                'Community Helpers',
                'A team working to improve our community.',
                challengeId,
                studentId
            )
        ).rejects.toThrow('CHALLENGE_NOT_OPEN');
    });

    it('rejects team creation after the challenge deadline before starting a transaction', async () => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue({
            _id: new mongoose.Types.ObjectId(challengeId),
            status: 'OPEN',
            deadline: new Date(0),
        } as never);
        const createSpy = jest.spyOn(Team, 'create');
        const sessionSpy = jest.spyOn(mongoose, 'startSession');

        await expect(createTeam('Community Helpers', 'A team improving our community.', challengeId, studentId))
            .rejects.toThrow('CHALLENGE_DEADLINE_PASSED');

        expect(createSpy).not.toHaveBeenCalled();
        expect(sessionSpy).not.toHaveBeenCalled();
    });

    it('rejects a second team when a later membership is already in the same challenge', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
                status: 'OPEN',
                deadline: new Date(Date.now() + 86_400_000),
            } as never);

        const existingTeam = {
            challenge: new mongoose.Types.ObjectId(challengeId),
        };

        jest.spyOn(TeamMember, 'find')
            .mockReturnValue({
                populate: jest.fn().mockResolvedValue([
                    { team: { challenge: new mongoose.Types.ObjectId() } },
                    { team: existingTeam },
                ]),
            } as never);

        const createSpy = jest.spyOn(Team, 'create');
            
        jest.spyOn(Application, 'findOne')
    .mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'ACCEPTED',
    } as never);

        await expect(
            createTeam(
                'Community Helpers',
                'A team working to improve our community.',
                challengeId,
                studentId
            )
        ).rejects.toThrow('ALREADY_IN_TEAM_FOR_CHALLENGE');

        expect(createSpy).not.toHaveBeenCalled();
    });

   
it('creates a team and assigns its creator as leader', async () => {
    jest.spyOn(Challenge, 'findById')
        .mockResolvedValue({
            _id: new mongoose.Types.ObjectId(challengeId),
            status: 'OPEN',
            deadline: new Date(Date.now() + 86_400_000),
        } as never);

    jest.spyOn(TeamMember, 'find')
        .mockReturnValue({
            populate: jest.fn().mockResolvedValue([
                { team: { challenge: new mongoose.Types.ObjectId() } },
                { team: null },
            ]),
        } as never);

    const createdTeam = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Community Helpers',
    };

    const session = {
        withTransaction: jest.fn(async (callback) => {
            await callback();
        }),
        endSession: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(mongoose, 'startSession')
        .mockResolvedValue(session as never);

    jest.spyOn(Team, 'create')
        .mockResolvedValue([createdTeam] as never);

    const memberCreateSpy = jest.spyOn(TeamMember, 'create')
        .mockResolvedValue([{ role: 'LEADER' }] as never);

        jest.spyOn(Application, 'findOne')
    .mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'ACCEPTED',
    } as never);

    const result = await createTeam(
        'Community Helpers',
        'A team working to improve our community.',
        challengeId,
        studentId
    );

    expect(Team.create).toHaveBeenCalledWith(
        [
            expect.objectContaining({
                name: 'Community Helpers',
                challenge: expect.any(mongoose.Types.ObjectId),
                createdBy: expect.any(mongoose.Types.ObjectId),
                status: 'ACTIVE',
            }),
        ],
        { session }
    );

    expect(memberCreateSpy).toHaveBeenCalledWith(
        [
            expect.objectContaining({
                team: createdTeam._id,
                user: expect.any(mongoose.Types.ObjectId),
                role: 'LEADER',
            }),
        ],
        { session }
    );

    expect(session.endSession).toHaveBeenCalled();
    expect(result).toBe(createdTeam);
});


it('closes the session when team membership creation fails', async () => {
    jest.spyOn(Challenge, 'findById')
        .mockResolvedValue({
            _id: new mongoose.Types.ObjectId(challengeId),
            status: 'OPEN',
            deadline: new Date(Date.now() + 86_400_000),
        } as never);

    jest.spyOn(TeamMember, 'find')
        .mockReturnValue({
            populate: jest.fn().mockResolvedValue([]),
        } as never);

    const session = {
        withTransaction: jest.fn(
            async (callback: () => Promise<unknown>) => {
                await callback();
            }
        ),
        endSession: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(mongoose, 'startSession')
        .mockResolvedValue(session as never);

    jest.spyOn(Team, 'create')
        .mockResolvedValue([
            { _id: new mongoose.Types.ObjectId() },
        ] as never);

    jest.spyOn(TeamMember, 'create')
        .mockRejectedValue(new Error('MEMBERSHIP_CREATION_FAILED'));


        jest.spyOn(Application, 'findOne')
    .mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'ACCEPTED',
    } as never);

    await expect(
        createTeam(
            'Community Helpers',
            'A team working to improve our community.',
            challengeId,
            studentId
        )
    ).rejects.toThrow('MEMBERSHIP_CREATION_FAILED');

    expect(session.endSession).toHaveBeenCalled();
});


    
});




describe('Team service — retrieval', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const teamId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';



it('rejects when the requested team does not exist', async () => {
    const query = {
        populate: jest.fn(),
    };

    query.populate
        .mockReturnValueOnce(query)
        .mockResolvedValueOnce(null);

    jest.spyOn(Team, 'findById')
        .mockReturnValue(query as never);

    await expect(
        getTeamById(teamId, userId)
    ).rejects.toThrow('TEAM_NOT_FOUND');

    expect(query.populate).toHaveBeenNthCalledWith(1, 'challenge');
    expect(query.populate).toHaveBeenNthCalledWith(
        2,
        'createdBy',
        'name email role'
    );
});


    it('rejects when retrieving members for a nonexistent team', async () => {
        jest.spyOn(Team, 'findById')
            .mockResolvedValue(null);

        await expect(
            getTeamMembers(teamId, userId)
        ).rejects.toThrow('TEAM_NOT_FOUND');
    });

    it('rejects team detail access by a non-member', async () => {
        const team = {
            _id: new mongoose.Types.ObjectId(teamId),
        };
        const query = {
            populate: jest.fn(),
        };

        query.populate
            .mockReturnValueOnce(query)
            .mockResolvedValueOnce(team);

        jest.spyOn(Team, 'findById')
            .mockReturnValue(query as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue(null);

        await expect(
            getTeamById(teamId, userId)
        ).rejects.toThrow('NOT_A_TEAM_MEMBER');
    });

    it('retrieves members after verifying that the team exists', async () => {
        const team = {
            _id: new mongoose.Types.ObjectId(teamId),
        };

        jest.spyOn(Team, 'findById')
            .mockResolvedValue(team as never);

        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ role: 'MEMBER' } as never);

        const members = [
            { role: 'LEADER', user: { name: 'Team Leader' } },
            { role: 'MEMBER', user: { name: 'Team Member' } },
        ];

        const populate = jest.fn().mockResolvedValue(members);

        jest.spyOn(TeamMember, 'find')
            .mockReturnValue({ populate } as never);

        const result = await getTeamMembers(teamId, userId);

        expect(TeamMember.find).toHaveBeenCalledWith({
            team: team._id,
        });
        expect(populate).toHaveBeenCalledWith(
            'user',
            'name email role'
        );
        expect(result).toBe(members);
    });

    it('allows an admin to retrieve members without team membership', async () => {
        const team = {
            _id: new mongoose.Types.ObjectId(teamId),
        };

        jest.spyOn(Team, 'findById')
            .mockResolvedValue(team as never);

        const membershipSpy = jest.spyOn(TeamMember, 'findOne');
        const populate = jest.fn().mockResolvedValue([]);
        jest.spyOn(TeamMember, 'find')
            .mockReturnValue({ populate } as never);

        await expect(
            getTeamMembers(teamId, userId, true)
        ).resolves.toEqual([]);

        expect(membershipSpy).not.toHaveBeenCalled();
    });
});
