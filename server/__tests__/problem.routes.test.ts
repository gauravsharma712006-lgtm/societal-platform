import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import User from '../src/models/user.model';
import * as problemService from '../src/services/problem.service';
const problemId = '507f1f77bcf86cd799439011';
import { Problem } from '../src/models/problem.model';
import * as mediaService from '../src/services/media.service';

const TEST_USER_ID = '507f1f77bcf86cd799439013';
let testRole = 'USER';

describe('Problem API routes', () => {


   

    beforeEach(() => {
        testRole = 'USER';
        jest.spyOn(User, 'findById').mockImplementation(
            (() => {
                const getUser = () => ({
                    _id: TEST_USER_ID,
                    role: testRole,
                    isVerified: true,
                });

                // Supports direct await, .select(),
                // .lean() and .exec() query patterns.
                const query = {
                    select: () => query,
                    lean: () => query,
                    exec: async () => getUser(),
                    then: (
                        resolve: (value: ReturnType<typeof getUser>) => unknown,
                        reject?: (reason: unknown) => unknown
                    ) =>
                        Promise.resolve(getUser()).then(
                            resolve,
                            reject
                        ),
                };

                return query;
            }) as never
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


    describe('Authenticated problem listing', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });


    

    it('rejects invalid problem data', async () => {
    const token = createTestToken('USER');

    const serviceSpy = jest.spyOn(
        problemService,
        'createProblem'
    );

    const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${token}`)
        .send({
            title: 'Bad',
            description: 'Too short',
            category: 'INVALID_CATEGORY',
            location: {},
        });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();

    serviceSpy.mockRestore();
});

    it('allows an authenticated user to create a problem', async () => {
    const token = createTestToken('USER');

    const problemData = {
        title: 'Broken streetlight',
        description:
            'The streetlight near the community park has not worked for several days.',
        category: 'INFRASTRUCTURE',
        location: {
            address: 'Near Community Park',
            city: 'Jabalpur',
            state: 'Madhya Pradesh',
            coordinates: {
                type: 'Point',
                coordinates: [79.9864, 23.1815],
            },
        },
        priority: 'HIGH',
    };

    const createdProblem = {
        _id: '507f1f77bcf86cd799439011',
        ...problemData,
        reportedBy: TEST_USER_ID,
        status: 'REPORTED',
    };

    const serviceSpy = jest
        .spyOn(problemService, 'createProblem')
        .mockResolvedValue(createdProblem as never);

    const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);

    expect(response.status).toBe(201);
    expect(serviceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            title: 'Broken streetlight',
            description:
                'The streetlight near the community park has not worked for several days.',
            priority: 'HIGH',
        }),
        TEST_USER_ID
    );

    serviceSpy.mockRestore();
});

    it('accepts a dynamic category ID when creating a problem', async () => {
        const token = createTestToken('USER');
        const categoryId = '507f1f77bcf86cd799439014';

        const serviceSpy = jest
            .spyOn(problemService, 'createProblem')
            .mockResolvedValue({
                _id: problemId,
                categoryId,
                category: 'INFRASTRUCTURE',
            } as never);

        const response = await request(app)
            .post('/api/problems')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Broken streetlight',
                description:
                    'The streetlight near the community park has not worked for several days.',
                categoryId,
                priority: 'HIGH',
                location: {
                    address: 'Near Community Park',
                    city: 'Jabalpur',
                    state: 'Madhya Pradesh',
                    coordinates: {
                        type: 'Point',
                        coordinates: [79.9864, 23.1815],
                    },
                },
            });

        expect(response.status).toBe(201);
        expect(serviceSpy).toHaveBeenCalledWith(
            expect.objectContaining({ categoryId }),
            TEST_USER_ID
        );
    });

    it('returns a client error for an inactive dynamic category', async () => {
        const token = createTestToken('USER');

        jest.spyOn(problemService, 'createProblem').mockRejectedValue(
            new Error('PROBLEM_CATEGORY_INACTIVE')
        );

        const response = await request(app)
            .post('/api/problems')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Broken streetlight',
                description:
                    'The streetlight near the community park has not worked for several days.',
                categoryId: '507f1f77bcf86cd799439014',
                priority: 'HIGH',
                location: {
                    address: 'Near Community Park',
                    city: 'Jabalpur',
                    state: 'Madhya Pradesh',
                },
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/inactive/i);
    });

    it('returns problems filtered by the authenticated user', async () => {
        const token = createTestToken('USER');

        const populate = jest.fn().mockResolvedValue([]);
        const sort = jest.fn().mockReturnValue({ populate });

        const findSpy = jest
            .spyOn(Problem, 'find')
            .mockReturnValue({ sort } as never);

        const response = await request(app)
            .get('/api/problems')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(findSpy).toHaveBeenCalledWith({
            reportedBy: TEST_USER_ID,
        });
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(populate).toHaveBeenCalledWith(
            'reportedBy',
            'name'
        );
    });

    it('allows an admin to list all problems', async () => {
        const token = createTestToken('ADMIN');

        const populate = jest.fn().mockResolvedValue([]);
        const sort = jest.fn().mockReturnValue({ populate });

        const findSpy = jest
            .spyOn(Problem, 'find')
            .mockReturnValue({ sort } as never);

        const response = await request(app)
            .get('/api/problems')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(findSpy).toHaveBeenCalledWith({});
    });
});

    it('returns 401 when no token is provided', async () => {
        const response = await request(app)
            .get('/api/problems');

        expect(response.status).toBe(401);
        expect(response.body.message)
            .toBe('Authentication required');
    });

    it('returns 401 when an invalid token is provided', async () => {
        const response = await request(app)
            .get('/api/problems')
            .set(
                'Authorization',
                'Bearer invalid-test-token'
            );

        expect(response.status).toBe(401);
    });

    it('returns 200 for the public health endpoint', async () => {
        const response = await request(app)
            .get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });


    describe('Admin-only problem routes', () => {
    const problemId = '507f1f77bcf86cd799439011';

    it('rejects a regular user updating problem status', async () => {
        const token = createTestToken('USER');

        const response = await request(app)
            .patch(`/api/problems/${problemId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'RESOLVED' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
            'You do not have permission to perform this action'
        );
    });

    it('rejects a regular user updating problem priority', async () => {
        const token = createTestToken('USER');

        const response = await request(app)
            .patch(`/api/problems/${problemId}/priority`)
            .set('Authorization', `Bearer ${token}`)
            .send({ priority: 'HIGH' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
            'You do not have permission to perform this action'
        );
    });

    it('rejects an invalid problem ID before authorization', async () => {
        const token = createTestToken('USER');

        const response = await request(app)
            .patch('/api/problems/not-an-id/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'RESOLVED' });

        expect(response.status).toBe(400);
    });
});



it('allows an admin to update problem status', async () => {
    const token = createTestToken('ADMIN');

    const serviceSpy = jest
        .spyOn(problemService, 'updateProblemStatus')
        .mockResolvedValue({} as never);

    const response = await request(app)
        .patch(`/api/problems/${problemId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'VERIFIED' });

    expect(response.status).toBe(200);
    expect(serviceSpy).toHaveBeenCalledWith(
        problemId,
        TEST_USER_ID,
        'VERIFIED',
        undefined
    );

    serviceSpy.mockRestore();
});

it('allows an admin to update problem priority', async () => {
    const token = createTestToken('ADMIN');

    const serviceSpy = jest
        .spyOn(problemService, 'updateProblemPriority')
        .mockResolvedValue({} as never);

    const response = await request(app)
        .patch(`/api/problems/${problemId}/priority`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: 'HIGH' });

    expect(response.status).toBe(200);
    expect(serviceSpy).toHaveBeenCalledWith(
        problemId,
        TEST_USER_ID,
        'HIGH'
    );

    serviceSpy.mockRestore();
});


describe('Problem media attachment', () => {
    const validMedia = {
        key: `problems/${problemId}/photo.jpg`,
        originalName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
    };

    beforeEach(() => {
        jest.spyOn(Problem, 'findOne').mockResolvedValue({
            _id: problemId,
            reportedBy: TEST_USER_ID,
            media: [],
        } as never);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects a media key belonging to a different problem', async () => {
        const token = createTestToken('USER');

        const metadataSpy = jest.spyOn(
            mediaService,
            'getObjectMetadata'
        );

        const attachSpy = jest.spyOn(
            problemService,
            'addProblemMedia'
        );

        const response = await request(app)
            .post(`/api/problems/${problemId}/media`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...validMedia,
                key: 'problems/507f1f77bcf86cd799439012/photo.jpg',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid media key');
        expect(metadataSpy).not.toHaveBeenCalled();
        expect(attachSpy).not.toHaveBeenCalled();
    });

    it('rejects media that does not exist in storage', async () => {
        const token = createTestToken('USER');

        const metadataSpy = jest
            .spyOn(mediaService, 'getObjectMetadata')
            .mockResolvedValue(null);

        const attachSpy = jest.spyOn(
            problemService,
            'addProblemMedia'
        );

        const response = await request(app)
            .post(`/api/problems/${problemId}/media`)
            .set('Authorization', `Bearer ${token}`)
            .send(validMedia);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Uploaded media was not found in storage'
        );
        expect(metadataSpy).toHaveBeenCalledWith(validMedia.key);
        expect(attachSpy).not.toHaveBeenCalled();
    });

    it('rejects uploaded media when stored metadata does not match', async () => {
        const token = createTestToken('USER');

        jest.spyOn(mediaService, 'getObjectMetadata').mockResolvedValue({
            contentType: validMedia.contentType,
            size: validMedia.size + 1,
        });

        const contentSpy = jest.spyOn(
            mediaService,
            'validateImageContent'
        );
        const attachSpy = jest.spyOn(
            problemService,
            'addProblemMedia'
        );

        const response = await request(app)
            .post(`/api/problems/${problemId}/media`)
            .set('Authorization', `Bearer ${token}`)
            .send(validMedia);

        expect(response.status).toBe(400);
        expect(contentSpy).not.toHaveBeenCalled();
        expect(attachSpy).not.toHaveBeenCalled();
    });

    it('rejects files whose bytes do not match the image type', async () => {
        const token = createTestToken('USER');

        jest.spyOn(mediaService, 'getObjectMetadata').mockResolvedValue({
            contentType: validMedia.contentType,
            size: validMedia.size,
        });
        jest.spyOn(
            mediaService,
            'validateImageContent'
        ).mockResolvedValue(false);

        const attachSpy = jest.spyOn(
            problemService,
            'addProblemMedia'
        );

        const response = await request(app)
            .post(`/api/problems/${problemId}/media`)
            .set('Authorization', `Bearer ${token}`)
            .send(validMedia);

        expect(response.status).toBe(400);
        expect(attachSpy).not.toHaveBeenCalled();
    });

    
it('attaches valid media successfully', async () => {
    const token = createTestToken('USER');

    const metadataSpy = jest
        .spyOn(mediaService, 'getObjectMetadata')
        .mockResolvedValue({
            contentType: validMedia.contentType,
            size: validMedia.size,
        });

    const contentSpy = jest
        .spyOn(mediaService, 'validateImageContent')
        .mockResolvedValue(true);

    const attachedProblem = {
        _id: problemId,
        title: 'Broken streetlight',
        media: [validMedia],
    };

    const attachSpy = jest
        .spyOn(problemService, 'addProblemMedia')
        .mockResolvedValue(attachedProblem as any);

    const response = await request(app)
        .post(`/api/problems/${problemId}/media`)
        .set('Authorization', `Bearer ${token}`)
        .send(validMedia);

    expect(response.status).toBe(200);
    expect(metadataSpy).toHaveBeenCalledWith(validMedia.key);
    expect(contentSpy).toHaveBeenCalledWith(
        validMedia.key,
        validMedia.contentType
    );
    expect(attachSpy).toHaveBeenCalledWith(
        problemId,
        TEST_USER_ID,
        validMedia
    );
});

     
it('rejects media attachment when the user does not own the problem', async () => {
    const token = createTestToken('USER');

    jest.spyOn(Problem, 'findOne').mockResolvedValue(null);

    const metadataSpy = jest.spyOn(mediaService, 'getObjectMetadata').mockResolvedValue({
        contentType: validMedia.contentType,
        size: validMedia.size,
    });

    jest.spyOn(
        mediaService,
        'validateImageContent'
    ).mockResolvedValue(true);

    jest.spyOn(
        problemService,
        'addProblemMedia'
    ).mockRejectedValue(new Error('PROBLEM_NOT_FOUND'));

    const response = await request(app)
        .post(`/api/problems/${problemId}/media`)
        .set('Authorization', `Bearer ${token}`)
        .send(validMedia);

    expect(response.status).toBe(404);
    expect(metadataSpy).not.toHaveBeenCalled();
});

    it('returns a useful retryable error when storage is unavailable', async () => {
        const token = createTestToken('USER');
        jest.spyOn(mediaService, 'getObjectMetadata').mockRejectedValue(
            new Error('MEDIA_STORAGE_UNAVAILABLE')
        );
        const attachSpy = jest.spyOn(problemService, 'addProblemMedia');

        const response = await request(app)
            .post(`/api/problems/${problemId}/media`)
            .set('Authorization', `Bearer ${token}`)
            .send(validMedia);

        expect(response.status).toBe(503);
        expect(response.body.message).toContain('temporarily unavailable');
        expect(attachSpy).not.toHaveBeenCalled();
    });




    it('rejects invalid media payloads', async () => {
        const token = createTestToken('USER');

        const metadataSpy = jest.spyOn(
            mediaService,
            'getObjectMetadata'
        );

        const attachSpy = jest.spyOn(
            problemService,
            'addProblemMedia'
        );

        const response = await request(app)
            .post(`/api/problems/${problemId}/media`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...validMedia,
                contentType: 'application/pdf',
                size: -1,
            });

        expect(response.status).toBe(400);
        expect(metadataSpy).not.toHaveBeenCalled();
        expect(attachSpy).not.toHaveBeenCalled();
    });
});


});



const createTestToken = (role: string): string => {
    testRole = role;

    return jwt.sign(
        {
            userId: TEST_USER_ID,
            role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );
};
