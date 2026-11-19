import mongoose from 'mongoose';

import {
    createTeamInvitation,
    respondToTeamInvitation,
} from './team-invitation.service';

import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { TeamInvitation } from '../models/team-invitation.model';
import { Challenge } from '../models/challenge.model';
import User from '../models/user.model';

jest.mock('../models/team.model');
jest.mock('../models/team-member.model');
jest.mock('../models/team-invitation.model');
jest.mock('../models/challenge.model');
jest.mock('../models/user.model');



describe('Team invitation service — creation', () => {
    const teamId = new mongoose.Types.ObjectId().toString();
    const challengeId = new mongoose.Types.ObjectId().toString();
    const studentId = new mongoose.Types.ObjectId().toString();
    const leaderId = new mongoose.Types.ObjectId().toString();

    const mockTeam = {
        _id: new mongoose.Types.ObjectId(teamId),
        challenge: new mongoose.Types.ObjectId(challengeId),
        status: 'ACTIVE',
    };

    const mockChallenge = {
        _id: new mongoose.Types.ObjectId(challengeId),
        status: 'OPEN',
        deadline: new Date(Date.now() + 86_400_000),
    };

    const mockStudent = {
        _id: new mongoose.Types.ObjectId(studentId),
        role: 'STUDENT',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a pending invitation when all checks pass', async () => {
        const mockInvitation = {
            _id: new mongoose.Types.ObjectId(),
            team: mockTeam._id,
            invitedUser: mockStudent._id,
            invitedBy: new mongoose.Types.ObjectId(leaderId),
            status: 'PENDING',
        };

        jest.spyOn(Team, 'findById')
            .mockResolvedValue(mockTeam as never);

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(mockChallenge as never);

        jest.spyOn(User, 'findById')
            .mockResolvedValue(mockStudent as never);

        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValueOnce({ role: 'LEADER' } as never)
            .mockResolvedValueOnce(null);

        jest.spyOn(TeamInvitation, 'findOne')
            .mockResolvedValue(null as never);

        jest.spyOn(TeamInvitation, 'create')
            .mockResolvedValue(mockInvitation as never);

        const result = await createTeamInvitation(
            teamId,
            studentId,
            leaderId
        );

        expect(TeamInvitation.create).toHaveBeenCalledWith(
            expect.objectContaining({
                team: mockTeam._id,
                invitedUser: expect.any(mongoose.Types.ObjectId),
                invitedBy: expect.any(mongoose.Types.ObjectId),
                status: 'PENDING',
            })
        );

        expect(result).toBe(mockInvitation);
    });

    it('rejects when the team does not exist', async () => {
        jest.spyOn(Team, 'findById')
            .mockResolvedValue(null);

        await expect(
            createTeamInvitation(teamId, studentId, leaderId)
        ).rejects.toThrow('TEAM_NOT_FOUND');
    });

    it('rejects invitation creation after the challenge deadline', async () => {
        jest.spyOn(Team, 'findById').mockResolvedValue(mockTeam as never);
        jest.spyOn(Challenge, 'findById').mockResolvedValue({
            ...mockChallenge, deadline: new Date(0),
        } as never);

        await expect(createTeamInvitation(teamId, studentId, leaderId))
            .rejects.toThrow('CHALLENGE_DEADLINE_PASSED');
        expect(TeamInvitation.create).not.toHaveBeenCalled();
    });

    it('rejects when the requester is not the team leader', async () => {
        jest.spyOn(Team, 'findById')
            .mockResolvedValue(mockTeam as never);

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(mockChallenge as never);

        jest.spyOn(User, 'findById')
            .mockResolvedValue(mockStudent as never);

        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue(null);

        await expect(
            createTeamInvitation(teamId, studentId, leaderId)
        ).rejects.toThrow('ONLY_TEAM_LEADER_CAN_INVITE');
    });

    it('rejects a user who is already a member of the team', async () => {
        jest.spyOn(Team, 'findById')
            .mockResolvedValue(mockTeam as never);

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(mockChallenge as never);

        jest.spyOn(User, 'findById')
            .mockResolvedValue(mockStudent as never);

        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValueOnce({ role: 'LEADER' } as never)
            .mockResolvedValueOnce({ role: 'MEMBER' } as never);

        await expect(
            createTeamInvitation(teamId, studentId, leaderId)
        ).rejects.toThrow('USER_ALREADY_TEAM_MEMBER');
    });

    it('rejects when an invitation is already pending', async () => {
        jest.spyOn(Team, 'findById')
            .mockResolvedValue(mockTeam as never);

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(mockChallenge as never);

        jest.spyOn(User, 'findById')
            .mockResolvedValue(mockStudent as never);

        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValueOnce({ role: 'LEADER' } as never)
            .mockResolvedValueOnce(null);

        jest.spyOn(TeamInvitation, 'findOne')
            .mockResolvedValue({ status: 'PENDING' } as never);

        await expect(
            createTeamInvitation(teamId, studentId, leaderId)
        ).rejects.toThrow('INVITATION_ALREADY_PENDING');
    });
});


const mockSessionQuery = <T,>(value: T) => ({
    session: jest.fn().mockResolvedValue(value),
});







describe('Team invitation service — responses', () => {




    const invitationId = new mongoose.Types.ObjectId().toString();
    const studentId = new mongoose.Types.ObjectId().toString();
    const teamId = new mongoose.Types.ObjectId().toString();
    const challengeId = new mongoose.Types.ObjectId().toString();

    const mockInvitation = {
        _id: new mongoose.Types.ObjectId(invitationId),
        team: new mongoose.Types.ObjectId(teamId),
        invitedUser: new mongoose.Types.ObjectId(studentId),
        status: 'PENDING',
        respondedAt: undefined as Date | undefined,
        save: jest.fn().mockResolvedValue(undefined),
    };

    const mockTeam = {
        _id: new mongoose.Types.ObjectId(teamId),
        challenge: new mongoose.Types.ObjectId(challengeId),
        status: 'ACTIVE',
    };

    const mockChallenge = {
        _id: new mongoose.Types.ObjectId(challengeId),
        status: 'OPEN',
        deadline: new Date(Date.now() + 86_400_000),
    };

    let session: {
        withTransaction: jest.Mock;
        endSession: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockInvitation.status = 'PENDING';
        mockInvitation.respondedAt = undefined;
        mockInvitation.save.mockResolvedValue(undefined);

        session = {
            withTransaction: jest.fn(
                async (callback: () => Promise<unknown>) => {
                    await callback();
                }
            ),
            endSession: jest.fn().mockResolvedValue(undefined),
        };

      jest.spyOn(mongoose, 'startSession').mockResolvedValue(
    session as never
);
    })

    it('rejects when the invitation does not exist', async () => {
        jest.spyOn(TeamInvitation, 'findById')
            .mockReturnValue(mockSessionQuery(null) as never);

        await expect(
            respondToTeamInvitation(invitationId, studentId, 'REJECTED')
        ).rejects.toThrow('INVITATION_NOT_FOUND');

        expect(session.endSession).toHaveBeenCalled();
    });

    it('rejects when someone other than the recipient responds', async () => {
        jest.spyOn(TeamInvitation, 'findById')
            .mockReturnValue(
                mockSessionQuery(mockInvitation) as never
            );

        await expect(
            respondToTeamInvitation(
                invitationId,
                new mongoose.Types.ObjectId().toString(),
                'REJECTED'
            )
        ).rejects.toThrow('NOT_INVITED_STUDENT');

        expect(session.endSession).toHaveBeenCalled();
    });

    it('rejects an invitation that has already been responded to', async () => {
        jest.spyOn(TeamInvitation, 'findById')
            .mockReturnValue(
                mockSessionQuery({
                    ...mockInvitation,
                    status: 'ACCEPTED',
                }) as never
            );

        await expect(
            respondToTeamInvitation(invitationId, studentId, 'REJECTED')
        ).rejects.toThrow('INVITATION_ALREADY_RESPONDED');

        expect(session.endSession).toHaveBeenCalled();
    });

    it('allows declining an expired pending invitation and records the response time', async () => {
        jest.spyOn(TeamInvitation, 'findById')
            .mockReturnValue(
                mockSessionQuery(mockInvitation) as never
            );

        jest.spyOn(Team, 'findById')
            .mockReturnValue(
                mockSessionQuery(mockTeam) as never
            );

        jest.spyOn(Challenge, 'findById')
            .mockReturnValue(
                mockSessionQuery({ ...mockChallenge, deadline: new Date(0) }) as never
            );

        const result = await respondToTeamInvitation(
            invitationId,
            studentId,
            'REJECTED'
        );

        expect(mockInvitation.status).toBe('REJECTED');
        expect(mockInvitation.respondedAt).toBeInstanceOf(Date);
        expect(mockInvitation.save).toHaveBeenCalledWith({
            session,
        });
        expect(result).toBe(mockInvitation);
        expect(session.endSession).toHaveBeenCalled();
    });

    it('rejects acceptance after the deadline without creating membership or saving a response', async () => {
        jest.spyOn(TeamInvitation, 'findById').mockReturnValue(mockSessionQuery(mockInvitation) as never);
        jest.spyOn(Team, 'findById').mockReturnValue(mockSessionQuery(mockTeam) as never);
        jest.spyOn(Challenge, 'findById').mockReturnValue(
            mockSessionQuery({ ...mockChallenge, deadline: new Date(0) }) as never
        );

        await expect(respondToTeamInvitation(invitationId, studentId, 'ACCEPTED'))
            .rejects.toThrow('CHALLENGE_DEADLINE_PASSED');
        expect(TeamMember.create).not.toHaveBeenCalled();
        expect(mockInvitation.save).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalled();
    });

    it('accepts an invitation and creates a team membership', async () => {
        jest.spyOn(TeamInvitation, 'findById')
            .mockReturnValue(
                mockSessionQuery(mockInvitation) as never
            );

        jest.spyOn(Team, 'findById')
            .mockReturnValue(
                mockSessionQuery(mockTeam) as never
            );

        jest.spyOn(Challenge, 'findById')
            .mockReturnValue(
                mockSessionQuery(mockChallenge) as never
            );

        jest.spyOn(TeamMember, 'find')
            .mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    session: jest.fn().mockResolvedValue([]),
                }),
            } as never);

        const membershipCreateSpy = jest.spyOn(TeamMember, 'create')
            .mockResolvedValue([
                {
                    team: mockTeam._id,
                    user: mockInvitation.invitedUser,
                    role: 'MEMBER',
                },
            ] as never);

        const result = await respondToTeamInvitation(
            invitationId,
            studentId,
            'ACCEPTED'
        );

        expect(membershipCreateSpy).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    team: mockTeam._id,
                    user: mockInvitation.invitedUser,
                    role: 'MEMBER',
                }),
            ],
            { session }
        );

        expect(mockInvitation.status).toBe('ACCEPTED');
        expect(mockInvitation.respondedAt).toBeInstanceOf(Date);
        expect(mockInvitation.save).toHaveBeenCalledWith({
            session,
        });
        expect(result).toBe(mockInvitation);
        expect(session.endSession).toHaveBeenCalled();
    });
});


