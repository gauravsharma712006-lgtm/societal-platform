
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import * as applicationService from '../src/services/application.service';
import User from '../src/models/user.model';

const challengeId = '507f1f77bcf86cd799439011';
const applicationId = '507f1f77bcf86cd799439012';
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

describe('Application API routes', () => {
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

    describe('Authentication and authorization', () => {
        it('rejects application creation without authentication', async () => {
            const response = await request(app)
                .post('/api/applications')
                .send({});

            expect(response.status).toBe(401);
        });

        it('rejects application creation by a regular USER', async () => {
            const token = createTestToken('USER');

            const response = await request(app)
                .post('/api/applications')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(403);
        });

        it('rejects viewing challenge applications by a STUDENT', async () => {
            const token = createTestToken('STUDENT');

            const response = await request(app)
                .get(`/api/applications/challenge/${challengeId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });

        it('rejects reviewing applications by a STUDENT', async () => {
            const token = createTestToken('STUDENT');

            const response = await request(app)
                .patch(`/api/applications/${applicationId}/review`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'ACCEPTED' });

            expect(response.status).toBe(403);
        });
    });

    describe('Path parameter validation', () => {
        it('rejects an invalid challenge ID when listing applications', async () => {
            const token = createTestToken('ADMIN');

            const serviceSpy = jest.spyOn(
                applicationService,
                'getApplicationsForChallenge'
            );

            const response = await request(app)
                .get('/api/applications/challenge/not-a-valid-id')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });

        it('rejects an invalid application ID when reviewing an application', async () => {
            const token = createTestToken('ADMIN');

            const serviceSpy = jest.spyOn(
                applicationService,
                'reviewApplication'
            );

            const response = await request(app)
                .patch('/api/applications/not-a-valid-id/review')
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'ACCEPTED' });

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });
    });

    describe('Application body validation', () => {
        it('rejects invalid application creation data', async () => {
            const token = createTestToken('STUDENT');

            const serviceSpy = jest.spyOn(
                applicationService,
                'createApplication'
            );

            const response = await request(app)
                .post('/api/applications')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    challenge: 'invalid-id',
                    motivation: 'Too short',
                    skills: [''],
                });

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });

        it('rejects an invalid application review status', async () => {
            const token = createTestToken('ADMIN');

            const serviceSpy = jest.spyOn(
                applicationService,
                'reviewApplication'
            );

            const response = await request(app)
                .patch(`/api/applications/${applicationId}/review`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'INVALID_STATUS' });

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });

        it('rejects a rejection without a review note', async () => {
            const token = createTestToken('ADMIN');

            const serviceSpy = jest.spyOn(
                applicationService,
                'reviewApplication'
            );

            const response = await request(app)
                .patch(`/api/applications/${applicationId}/review`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'REJECTED' });

            expect(response.status).toBe(400);
            expect(serviceSpy).not.toHaveBeenCalled();
        });
    });


    it('rejects a rejection with a whitespace-only review note', async () => {
    const token = createTestToken('ADMIN');

    const serviceSpy = jest.spyOn(
        applicationService,
        'reviewApplication'
    );

    const response = await request(app)
        .patch(`/api/applications/${applicationId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            status: 'REJECTED',
            reviewNote: '   ',
        });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
});
});
