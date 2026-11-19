import mongoose from 'mongoose';
import { Challenge } from '../models/challenge.model';
import { Problem } from '../models/problem.model';
import {
    createChallenge,
    updateChallengeStatus,
    updateChallenge,
    isChallengeAcceptingApplications,
    getChallenges,
    getChallengeById,
} from './challenge.service';



describe('Challenge service — status transitions', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const challengeId = '507f1f77bcf86cd799439011';

    it('allows a DRAFT challenge to become OPEN', async () => {
        const challenge = {
            status: 'DRAFT',
            save: jest.fn().mockResolvedValue(undefined),
        };

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(challenge as never);

        const result = await updateChallengeStatus(challengeId, 'OPEN');

        expect(result.status).toBe('OPEN');
        expect(challenge.save).toHaveBeenCalledTimes(1);
    });


    it('rejects an invalid transition from DRAFT to COMPLETED', async () => {
        const challenge = {
            status: 'DRAFT',
            save: jest.fn().mockResolvedValue(undefined),
        };

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(challenge as never);

        await expect(
            updateChallengeStatus(challengeId, 'COMPLETED')
        ).rejects.toThrow('INVALID_STATUS_TRANSITION');

        expect(challenge.save).not.toHaveBeenCalled();
    });

    it('rejects status updates when the challenge does not exist', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(null);

        await expect(
            updateChallengeStatus(challengeId, 'OPEN')
        ).rejects.toThrow('CHALLENGE_NOT_FOUND');
    });



    

    it.each(['COMPLETED', 'CANCELLED'] as const)(
        'rejects transitions from terminal status %s',
        async (currentStatus) => {
            const challenge = {
                status: currentStatus,
                save: jest.fn().mockResolvedValue(undefined),
            };

            jest.spyOn(Challenge, 'findById')
                .mockResolvedValue(challenge as never);

            await expect(
                updateChallengeStatus(challengeId, 'OPEN')
            ).rejects.toThrow('INVALID_STATUS_TRANSITION');

            expect(challenge.save).not.toHaveBeenCalled();
        }
    );

    
    it.each([
        ['DRAFT', 'CANCELLED'],
        ['OPEN', 'CLOSED'],
        ['OPEN', 'CANCELLED'],
        ['CLOSED', 'IN_PROGRESS'],
        ['IN_PROGRESS', 'COMPLETED'],
    ])('allows %s → %s', async (currentStatus, nextStatus) => {
        const challenge = {
            status: currentStatus,
            save: jest.fn().mockResolvedValue(undefined),
        };

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(challenge as never);

        const result = await updateChallengeStatus(
            '507f1f77bcf86cd799439011',
            nextStatus as
                | 'OPEN'
                | 'CLOSED'
                | 'IN_PROGRESS'
                | 'COMPLETED'
                | 'CANCELLED'
        );

        expect(result.status).toBe(nextStatus);
        expect(challenge.save).toHaveBeenCalledTimes(1);
    });

   

});

describe('Challenge service — visibility', () => {
    afterEach(() => jest.restoreAllMocks());

    it.each([false, true])('keeps closed challenges visible (admin=%s)', async (isAdmin) => {
        const query = { populate: jest.fn(), sort: jest.fn().mockResolvedValue([]) };
        query.populate.mockReturnValue(query);
        jest.spyOn(Challenge, 'find').mockReturnValue(query as never);

        await getChallenges(isAdmin);

        expect(Challenge.find).toHaveBeenCalledWith({
            status: { $in: expect.arrayContaining(['CLOSED']) },
        });
        const privateStatuses = { status: { $in: expect.arrayContaining(['DRAFT', 'CANCELLED']) } };
        if (isAdmin) {
            expect(Challenge.find).toHaveBeenCalledWith(privateStatuses);
        } else {
            expect(Challenge.find).not.toHaveBeenCalledWith(privateStatuses);
        }
    });

    it.each(['DRAFT', 'CANCELLED'])('lets admins inspect %s while hiding it from other roles', async (status) => {
        const challenge = { status };
        const query = { populate: jest.fn() };
        query.populate.mockReturnValueOnce(query).mockResolvedValueOnce(challenge);
        jest.spyOn(Challenge, 'findById').mockReturnValue(query as never);

        await expect(getChallengeById('507f1f77bcf86cd799439011', false))
            .rejects.toThrow('CHALLENGE_NOT_AVAILABLE');
        query.populate.mockReset().mockReturnValueOnce(query).mockResolvedValueOnce(challenge);
        await expect(getChallengeById('507f1f77bcf86cd799439011', true))
            .resolves.toBe(challenge);
    });
});




describe('Challenge service — creation', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const problemId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';

    const creationData = {
        title: 'Clean Water Challenge',
        description: 'Develop a solution for clean water access.',
        problemId,
        deadline: new Date('2027-12-31T23:59:59Z'),
        skills: ['React', 'Node.js'],
        eligibility: 'Open to university students',
        userId,
    };

    it('rejects creation when the problem does not exist', async () => {
        jest.spyOn(Problem, 'findById')
            .mockResolvedValue(null);

        await expect(
            createChallenge(
                creationData.title,
                creationData.description,
                creationData.problemId,
                creationData.deadline,
                creationData.skills,
                creationData.eligibility,
                creationData.userId
            )
        ).rejects.toThrow('PROBLEM_NOT_FOUND');
    });

    it('rejects creation when the problem is not verified', async () => {
        jest.spyOn(Problem, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(problemId),
                status: 'PENDING',
            } as never);

        await expect(
            createChallenge(
                creationData.title,
                creationData.description,
                creationData.problemId,
                creationData.deadline,
                creationData.skills,
                creationData.eligibility,
                creationData.userId
            )
        ).rejects.toThrow('PROBLEM_NOT_VERIFIED');
    });

    it('rejects creation when an active challenge already exists', async () => {
        jest.spyOn(Problem, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(problemId),
                status: 'VERIFIED',
            } as never);

        jest.spyOn(Challenge, 'findOne')
            .mockResolvedValue({ status: 'OPEN' } as never);

        await expect(
            createChallenge(
                creationData.title,
                creationData.description,
                creationData.problemId,
                creationData.deadline,
                creationData.skills,
                creationData.eligibility,
                creationData.userId
            )
        ).rejects.toThrow('CHALLENGE_ALREADY_EXISTS');
    });

    it('creates a DRAFT challenge for a verified problem', async () => {
        const createdChallenge = {
            ...creationData,
            status: 'DRAFT',
        };

        jest.spyOn(Problem, 'findById')
            .mockResolvedValue({
                _id: new mongoose.Types.ObjectId(problemId),
                status: 'VERIFIED',
            } as never);

        jest.spyOn(Challenge, 'findOne')
            .mockResolvedValue(null);

        const createSpy = jest.spyOn(Challenge, 'create')
            .mockResolvedValue(createdChallenge as never);

        const result = await createChallenge(
            creationData.title,
            creationData.description,
            creationData.problemId,
            creationData.deadline,
            creationData.skills,
            creationData.eligibility,
            creationData.userId
        );

        expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                title: creationData.title,
                problem: expect.any(mongoose.Types.ObjectId),
                createdBy: expect.any(mongoose.Types.ObjectId),
                status: 'DRAFT',
            })
        );

        expect(result).toBe(createdChallenge);
    });
});







describe('Challenge service — editing', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const challengeId = '507f1f77bcf86cd799439011';

    const makeChallenge = (status: string) => ({
        status,
        title: 'Original title',
        description: 'Original description',
        deadline: new Date('2027-12-31T23:59:59Z'),
        skills: ['React'],
        eligibility: 'Students',
        save: jest.fn().mockResolvedValue(undefined),
    });

    it('updates and saves an editable challenge', async () => {
        const challenge = makeChallenge('OPEN');

        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(challenge as never);

        const result = await updateChallenge(challengeId, {
            title: 'Updated title',
            skills: ['React', 'Node.js'],
        });

        expect(result.title).toBe('Updated title');
        expect(result.skills).toEqual(['React', 'Node.js']);
        expect(challenge.save).toHaveBeenCalledTimes(1);
    });

    it.each(['COMPLETED', 'CANCELLED'])(
        'rejects editing a %s challenge',
        async (status) => {
            const challenge = makeChallenge(status);

            jest.spyOn(Challenge, 'findById')
                .mockResolvedValue(challenge as never);

            await expect(
                updateChallenge(challengeId, {
                    title: 'Updated title',
                })
            ).rejects.toThrow('CHALLENGE_NOT_EDITABLE');

            expect(challenge.save).not.toHaveBeenCalled();
        }
    );

    it('rejects editing a challenge that does not exist', async () => {
        jest.spyOn(Challenge, 'findById')
            .mockResolvedValue(null);

        await expect(
            updateChallenge(challengeId, {
                title: 'Updated title',
            })
        ).rejects.toThrow('CHALLENGE_NOT_FOUND');
    });
});





