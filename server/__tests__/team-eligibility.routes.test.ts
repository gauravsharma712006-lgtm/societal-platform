import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/user.model';
import * as teamService from '../src/services/team.service';
import * as invitationService from '../src/services/team-invitation.service';

jest.mock('../src/services/team.service');
jest.mock('../src/services/team-invitation.service');

const challengeId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439013';
const teamId = '507f1f77bcf86cd799439014';

describe('Team eligibility route error handling', () => {
    let token: string;

    beforeEach(() => {
        jest.resetAllMocks();
        token = jwt.sign({ userId, role: 'STUDENT' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        jest.spyOn(User, 'findById').mockReturnValue({
            select: () => Promise.resolve({ _id: userId, role: 'STUDENT' }),
        } as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it.each([
        ['APPLICATION_NOT_ACCEPTED', 403],
        ['CHALLENGE_DEADLINE_PASSED', 400],
    ])('returns a client error for %s during team creation', async (error, status) => {
        jest.mocked(teamService.createTeam).mockRejectedValue(new Error(String(error)));

        const response = await request(app).post('/api/teams')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Community Helpers', description: 'A team improving our community.', challenge: challengeId });

        expect(response.status).toBe(status);
        expect(teamService.createTeam).toHaveBeenCalled();
    });

    it('explains expired invitation creation', async () => {
        jest.mocked(invitationService.createTeamInvitation)
            .mockRejectedValue(new Error('CHALLENGE_DEADLINE_PASSED'));

        const response = await request(app).post('/api/team-invitations')
            .set('Authorization', `Bearer ${token}`)
            .send({ team: teamId, invitedUser: challengeId });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/deadline.*passed/i);
        expect(invitationService.createTeamInvitation).toHaveBeenCalled();
    });

    it('explains expired invitation acceptance', async () => {
        jest.mocked(invitationService.respondToTeamInvitation)
            .mockRejectedValue(new Error('CHALLENGE_DEADLINE_PASSED'));

        const response = await request(app).patch(`/api/team-invitations/${teamId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'ACCEPTED' });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/deadline.*passed/i);
        expect(invitationService.respondToTeamInvitation).toHaveBeenCalledWith(teamId, userId, 'ACCEPTED');
    });
});
