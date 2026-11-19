
import mongoose from 'mongoose';
import { Application } from '../models/application.model';
import { Challenge } from '../models/challenge.model';
import {
    createApplication,
    getMyApplications,
    getApplicationsForChallenge,
    reviewApplication,
} from './application.service';

describe('Application service — creation', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const challengeId = '507f1f77bcf86cd799439011';
    const applicantId = '507f191e810c19729de860ea';

    it('rejects when the challenge does not exist', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(null);

        await expect(
            createApplication(
                challengeId,
                applicantId,
                'I want to help solve this community problem.',
                ['React']
            )
        ).rejects.toThrow('CHALLENGE_NOT_FOUND');
    });

    it('rejects when the challenge is not accepting applications', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
                status: 'CLOSED',
            } as never);

        await expect(
            createApplication(
                challengeId,
                applicantId,
                'I want to help solve this community problem.',
                ['React']
            )
        ).rejects.toThrow('CHALLENGE_NOT_ACCEPTING_APPLICATIONS');
    });

    it('rejects a duplicate application found before creation', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
            } as never);

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
                status: 'OPEN',
                deadline: new Date(Date.now() + 86400000),
            } as never);

        jest.spyOn(Application, 'findOne')
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);

        const createSpy = jest.spyOn(Application, 'create');

        await expect(
            createApplication(
                challengeId,
                applicantId,
                'I want to help solve this community problem.',
                ['React']
            )
        ).rejects.toThrow('APPLICATION_ALREADY_EXISTS');

        expect(createSpy).not.toHaveBeenCalled();
    });

    it('creates a PENDING application for an eligible challenge', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
                status: 'OPEN',
                deadline: new Date(Date.now() + 86400000),
            } as never);

        jest.spyOn(Application, 'findOne')
            .mockResolvedValue(null);

        const createdApplication = { status: 'PENDING' };

        const createSpy = jest.spyOn(Application, 'create')
            .mockResolvedValue(createdApplication as never);

        const result = await createApplication(
            challengeId,
            applicantId,
            'I want to help solve this community problem.',
            ['React']
        );

        expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                challenge: expect.any(mongoose.Types.ObjectId),
                applicant: expect.any(mongoose.Types.ObjectId),
                status: 'PENDING',
                skills: ['React'],
            })
        );

        expect(result).toBe(createdApplication);
    });

    it('translates a MongoDB duplicate-key error into APPLICATION_ALREADY_EXISTS', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(challengeId),
                status: 'OPEN',
                deadline: new Date(Date.now() + 86400000),
            } as never);

        jest.spyOn(Application, 'findOne')
            .mockResolvedValue(null);

        const duplicateKeyError = Object.assign(
            new Error('Duplicate key'),
            { code: 11000 }
        );

        jest.spyOn(Application, 'create')
            .mockRejectedValue(duplicateKeyError);

        await expect(
            createApplication(
                challengeId,
                applicantId,
                'I want to help solve this community problem.',
                ['React']
            )
        ).rejects.toThrow('APPLICATION_ALREADY_EXISTS');
    });
});

describe('Application service — review', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const applicationId = '507f1f77bcf86cd799439012';
    const adminId = '507f191e810c19729de860eb';

    it('rejects reviewing an application that does not exist', async () => {
        jest.spyOn(Application, 'findById')
            .mockResolvedValue(null);

        await expect(
            reviewApplication(applicationId, adminId, 'ACCEPTED')
        ).rejects.toThrow('APPLICATION_NOT_FOUND');
    });

    it('rejects reviewing an application that has already been reviewed', async () => {
        jest.spyOn(Application, 'findById')
            .mockResolvedValue({
                status: 'ACCEPTED',
            } as never);

        await expect(
            reviewApplication(applicationId, adminId, 'REJECTED', 'Not suitable')
        ).rejects.toThrow('APPLICATION_ALREADY_REVIEWED');
    });

    it('requires a review note when rejecting an application', async () => {
        jest.spyOn(Application, 'findById')
            .mockResolvedValue({
                status: 'PENDING',
            } as never);

        await expect(
            reviewApplication(applicationId, adminId, 'REJECTED')
        ).rejects.toThrow('REVIEW_NOTE_REQUIRED');
    });

    it('accepts a pending application and records the reviewer', async () => {
        const application = {
            status: 'PENDING',
            save: jest.fn().mockResolvedValue(undefined),
        };

        jest.spyOn(Application, 'findById')
            .mockResolvedValue(application as never);

        const result = await reviewApplication(
            applicationId,
            adminId,
            'ACCEPTED'
        );

        expect(result.status).toBe('ACCEPTED');
        expect(application.save).toHaveBeenCalledTimes(1);
    });

    it('rejects a pending application with a review note', async () => {
        const application = {
            status: 'PENDING',
            save: jest.fn().mockResolvedValue(undefined),
        };

        jest.spyOn(Application, 'findById')
            .mockResolvedValue(application as never);

        const result = await reviewApplication(
            applicationId,
            adminId,
            'REJECTED',
            'The application does not meet the current requirements.'
        );

        expect(result.status).toBe('REJECTED');
        expect(result.reviewNote).toBe(
            'The application does not meet the current requirements.'
        );
        expect(application.save).toHaveBeenCalledTimes(1);
    });
});









describe('Application service — listing', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const challengeId = '507f1f77bcf86cd799439011';
    const applicantId = '507f191e810c19729de860ea';

    it('retrieves the current applicant’s applications with challenge details', async () => {
        const applications = [
            { status: 'PENDING' },
            { status: 'ACCEPTED' },
        ];

        const sortSpy = jest.fn().mockResolvedValue(applications);
        const populateSpy = jest.fn().mockReturnValue({
            sort: sortSpy,
        });

        jest.spyOn(Application, 'find')
            .mockReturnValue({
                populate: populateSpy,
            } as never);

        const result = await getMyApplications(applicantId);

        expect(Application.find).toHaveBeenCalledWith({
            applicant: new mongoose.Types.ObjectId(applicantId),
        });

        expect(populateSpy).toHaveBeenCalledWith(
            'challenge',
            'title description status deadline skills eligibility'
        );

        expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toBe(applications);
    });

    it('retrieves applications for an existing challenge with applicant details', async () => {
        const challenge = {
            _id: new mongoose.Types.ObjectId(challengeId),
        };

        const applications = [
            { status: 'PENDING' },
            { status: 'REJECTED' },
        ];

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(challenge as never);

        const sortSpy = jest.fn().mockResolvedValue(applications);
        const populateSpy = jest.fn().mockReturnValue({
            sort: sortSpy,
        });

        jest.spyOn(Application, 'find')
            .mockReturnValue({
                populate: populateSpy,
            } as never);

        const result = await getApplicationsForChallenge(challengeId);

        expect(Challenge.findById).toHaveBeenCalledWith(challengeId);

        expect(Application.find).toHaveBeenCalledWith({
            challenge: challenge._id,
        });

        expect(populateSpy).toHaveBeenCalledWith(
            'applicant',
            'name email role'
        );

        expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toBe(applications);
    });

    it('rejects listing applications when the challenge does not exist', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(null);

        const findSpy = jest.spyOn(Application, 'find');

        await expect(
            getApplicationsForChallenge(challengeId)
        ).rejects.toThrow('CHALLENGE_NOT_FOUND');

        expect(findSpy).not.toHaveBeenCalled();
    });
});


