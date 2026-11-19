
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import * as challengeService from '../src/services/challenge.service';
import User from '../src/models/user.model';

const challengeId = '507f1f77bcf86cd799439011';
const testUserId = '507f1f77bcf86cd799439013';
let testRole = 'USER';

const createTestToken = (role: string): string => {
    testRole = role;

    return jwt.sign(
        {
            userId: testUserId,
            role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );
};

describe('Challenge API routes', () => {
    beforeEach(() => {
        jest.spyOn(User, 'findById').mockImplementation(
            (() => {
                const query = {
                    select: () => query,
                    then: (
                        resolve: (value: unknown) => unknown,
                        reject?: (reason: unknown) => unknown
                    ) => Promise.resolve({
                        _id: testUserId,
                        role: testRole,
                    }).then(resolve, reject),
                };

                return query;
            }) as never
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each(['ADMIN', 'STUDENT'])('uses the authenticated %s role for challenge visibility', async (role) => {
        const token = createTestToken(role);
        const listSpy = jest.spyOn(challengeService, 'getChallenges').mockResolvedValue([]);
        const detailSpy = jest.spyOn(challengeService, 'getChallengeById')
            .mockResolvedValue({ _id: challengeId, status: 'OPEN' } as never);

        expect((await request(app).get('/api/challenges')
            .set('Authorization', `Bearer ${token}`)).status).toBe(200);
        expect(listSpy).toHaveBeenCalledWith(role === 'ADMIN');
        expect((await request(app).get(`/api/challenges/${challengeId}`)
            .set('Authorization', `Bearer ${token}`)).status).toBe(200);
        expect(detailSpy).toHaveBeenCalledWith(challengeId, role === 'ADMIN');
    });


    



    
it('rejects an invalid challenge ID when fetching a challenge', async () => {
    const token = createTestToken('USER');

    const serviceSpy = jest.spyOn(
        challengeService,
        'getChallengeById'
    );

    const response = await request(app)
        .get('/api/challenges/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
});

it('rejects an invalid challenge ID when updating status', async () => {
    const token = createTestToken('ADMIN');

    const serviceSpy = jest.spyOn(
        challengeService,
        'updateChallengeStatus'
    );

    const response = await request(app)
        .patch('/api/challenges/not-a-valid-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'OPEN' });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
});

it('rejects an invalid challenge ID when editing a challenge', async () => {
    const token = createTestToken('ADMIN');

    const serviceSpy = jest.spyOn(
        challengeService,
        'updateChallenge'
    );

    const response = await request(app)
        .patch('/api/challenges/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Community Challenge' });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
});


    describe('Authentication and authorization', () => {
        it('rejects listing challenges without authentication', async () => {
            const response = await request(app)
                .get('/api/challenges');

            expect(response.status).toBe(401);
        });

        it('rejects challenge creation by a regular user', async () => {
            const token = createTestToken('USER');

            const response = await request(app)
                .post('/api/challenges')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(403);
        });

        it('rejects challenge status updates by a regular user', async () => {
            const token = createTestToken('USER');

            const response = await request(app)
                .patch(`/api/challenges/${challengeId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'OPEN' });

            expect(response.status).toBe(403);
        });
    });

    describe('Challenge validation', () => {
        it('rejects invalid challenge creation data', async () => {
            const token = createTestToken('ADMIN');

            const serviceSpy = jest.spyOn(
                challengeService,
                'createChallenge'
            );

            const response = await request(app)
                .post('/api/challenges')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Bad',
                    description: 'Too short',
                    problem: 'invalid-id',
                    deadline: 'not-a-date',
                    skills: [],
                    eligibility: '',
                });

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });

        it('rejects an invalid challenge status', async () => {
            const token = createTestToken('ADMIN');

            const response = await request(app)
                .patch(`/api/challenges/${challengeId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'INVALID_STATUS' });

            expect(response.status).toBe(400);
        });

        it('rejects an empty challenge update', async () => {
            const token = createTestToken('ADMIN');

            const serviceSpy = jest.spyOn(
                challengeService,
                'updateChallenge'
            );

            const response = await request(app)
                .patch(`/api/challenges/${challengeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });
    });
});
