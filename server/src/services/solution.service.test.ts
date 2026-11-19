
import mongoose from 'mongoose';
import { Solution } from '../models/solution.model';
import { Challenge } from '../models/challenge.model';
import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import {
    createSolution,
    getSolutionById,
    getSolutionsForChallenge,
    reviewSolution,
    updateSolutionImplementationStatus,
    addSolutionMilestone,
    updateSolutionMilestone,
    recordSolutionImpact,
    createSolutionEvidenceUpload,
    attachSolutionEvidence,
    getSolutionEvidence,
} from './solution.service';





describe('Solution service — submission', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    beforeEach(() => {
        jest.spyOn(Solution, 'create')
            .mockResolvedValue({} as never);
    });

    const challengeId = '507f1f77bcf86cd799439011';
    const teamId = '507f1f77bcf86cd799439012';
    const userId = '507f191e810c19729de860ea';

    const input = {
        challenge: challengeId,
        team: teamId,
        title: 'Community Water Filter',
        description: 'A practical water filtration solution for the community.',
        approach: 'Install and maintain low-cost filters at community water points.',
    };

    const mockChallenge = (status = 'OPEN') => ({
        _id: new mongoose.Types.ObjectId(challengeId),
        status,
    });

    const mockTeam = (status = 'ACTIVE') => ({
        _id: new mongoose.Types.ObjectId(teamId),
        challenge: new mongoose.Types.ObjectId(challengeId),
        status,
    });

    const mockMembership = () => ({
        team: new mongoose.Types.ObjectId(teamId),
        user: new mongoose.Types.ObjectId(userId),
    });

    it('rejects submission when the challenge does not exist', async () => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(null);
        jest.spyOn(Team, 'findById').mockResolvedValue(mockTeam() as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(mockMembership() as never);

        await expect(createSolution(input, userId))
            .rejects.toThrow('CHALLENGE_NOT_FOUND');

        expect(Solution.create).not.toHaveBeenCalled();
    });

    it('rejects submission when the team does not exist', async () => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(mockChallenge() as never);
        jest.spyOn(Team, 'findById').mockResolvedValue(null);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(mockMembership() as never);

        await expect(createSolution(input, userId))
            .rejects.toThrow('TEAM_NOT_FOUND');

        expect(Solution.create).not.toHaveBeenCalled();
    });

    it('rejects a team that belongs to a different challenge', async () => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(mockChallenge() as never);
        jest.spyOn(Team, 'findById').mockResolvedValue({
            ...mockTeam(),
            challenge: new mongoose.Types.ObjectId('507f191e810c19729de860eb'),
        } as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(mockMembership() as never);

        await expect(createSolution(input, userId))
            .rejects.toThrow('TEAM_CHALLENGE_MISMATCH');

        expect(Solution.create).not.toHaveBeenCalled();
    });

    it('rejects submission by someone who is not a team member', async () => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(mockChallenge() as never);
        jest.spyOn(Team, 'findById').mockResolvedValue(mockTeam() as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(null);

        await expect(createSolution(input, userId))
            .rejects.toThrow('NOT_A_TEAM_MEMBER');

        expect(Solution.create).not.toHaveBeenCalled();
    });

    it('rejects submission when the team is inactive', async () => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(mockChallenge() as never);
        jest.spyOn(Team, 'findById').mockResolvedValue(mockTeam('CANCELLED') as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(mockMembership() as never);

        await expect(createSolution(input, userId))
            .rejects.toThrow('TEAM_NOT_ACTIVE');

        expect(Solution.create).not.toHaveBeenCalled();
    });

    it.each(['CLOSED', 'DRAFT', 'COMPLETED', 'CANCELLED'])('rejects submission when the challenge is %s', async (status) => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(mockChallenge(status) as never);
        jest.spyOn(Team, 'findById').mockResolvedValue(mockTeam() as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(mockMembership() as never);

        await expect(createSolution(input, userId))
            .rejects.toThrow('CHALLENGE_NOT_OPEN');

        expect(Solution.create).not.toHaveBeenCalled();
    });

    it.each(['OPEN', 'IN_PROGRESS'])('allows an existing team to submit during %s', async (status) => {
        jest.spyOn(Challenge, 'findById').mockResolvedValue(mockChallenge(status) as never);
        jest.spyOn(Team, 'findById').mockResolvedValue(mockTeam() as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(mockMembership() as never);

        await createSolution(input, userId);

        expect(Solution.create).toHaveBeenCalledWith(expect.objectContaining({
            challenge: expect.any(mongoose.Types.ObjectId),
            team: expect.any(mongoose.Types.ObjectId),
            reviewStatus: 'PENDING',
        }));
    });

    it('rejects invalid IDs before querying the database', async () => {
        const challengeSpy = jest.spyOn(Challenge, 'findById');

        await expect(createSolution(
            { ...input, team: 'invalid-id' },
            userId
        )).rejects.toThrow('INVALID_ID');

        expect(challengeSpy).not.toHaveBeenCalled();
    });
});





describe('Solution service — retrieval', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const solutionId = '507f1f77bcf86cd799439011';
    const teamId = '507f1f77bcf86cd799439012';
    const userId = '507f191e810c19729de860ea';
    const otherUserId = '507f191e810c19729de860eb';
    const challengeId = '507f1f77bcf86cd799439013';

    const createQuery = <T,>(value: T) => {
        const query = {
            populate: jest.fn(),
            sort: jest.fn(),
            select: jest.fn(),
            then: (
                resolve: (value: T) => unknown,
                reject?: (reason: unknown) => unknown
            ) => Promise.resolve(value).then(resolve, reject),
        };

        query.populate.mockReturnValue(query);
        query.sort.mockReturnValue(query);
        query.select.mockReturnValue(query);

        return query;
    };

    const makeSolution = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(solutionId),
        challenge: new mongoose.Types.ObjectId(challengeId),
        team: new mongoose.Types.ObjectId(teamId),
        submittedBy: new mongoose.Types.ObjectId(otherUserId),
        reviewedBy: undefined,
        reviewStatus: 'PENDING',
        ...overrides,
    });

    describe('getSolutionById', () => {
        it('rejects retrieval when the solution does not exist', async () => {
            const query = createQuery(null);

            jest.spyOn(Solution, 'findById')
                .mockReturnValue(query as never);

            await expect(
                getSolutionById(solutionId, userId)
            ).rejects.toThrow('SOLUTION_NOT_FOUND');
        });

        it('rejects invalid solution IDs before querying', async () => {
            const findSpy = jest.spyOn(Solution, 'findById');

            await expect(
                getSolutionById('invalid-id', userId)
            ).rejects.toThrow('INVALID_ID');

            expect(findSpy).not.toHaveBeenCalled();
        });

        it('allows an administrator to retrieve a solution', async () => {
            const solution = makeSolution();
            const query = createQuery(solution);
            const membershipSpy = jest.spyOn(TeamMember, 'findOne');

            jest.spyOn(Solution, 'findById')
                .mockReturnValue(query as never);

            const result = await getSolutionById(
                solutionId,
                userId,
                true
            );

            expect(result).toBe(solution);
            expect(membershipSpy).not.toHaveBeenCalled();
        });

        it('allows a member of the solution team to retrieve it', async () => {
            const solution = makeSolution();
            const query = createQuery(solution);

            jest.spyOn(Solution, 'findById')
                .mockReturnValue(query as never);

            const membershipSpy = jest.spyOn(TeamMember, 'findOne')
                .mockResolvedValue({ team: teamId, user: userId } as never);

            const result = await getSolutionById(solutionId, userId);

            expect(result).toBe(solution);
            expect(membershipSpy).toHaveBeenCalled();
        });

        it('allows the original submitter to retrieve their solution', async () => {
            const solution = makeSolution({
                submittedBy: new mongoose.Types.ObjectId(userId),
            });
            const query = createQuery(solution);

            jest.spyOn(Solution, 'findById')
                .mockReturnValue(query as never);

            jest.spyOn(TeamMember, 'findOne')
                .mockResolvedValue(null);

            const result = await getSolutionById(solutionId, userId);

            expect(result).toBe(solution);
        });

        it('denies access to an unrelated user', async () => {
            const solution = makeSolution();
            const query = createQuery(solution);

            jest.spyOn(Solution, 'findById')
                .mockReturnValue(query as never);

            jest.spyOn(TeamMember, 'findOne')
                .mockResolvedValue(null);

            await expect(
                getSolutionById(solutionId, userId)
            ).rejects.toThrow('NOT_A_TEAM_MEMBER');
        });
    });

    describe('getSolutionsForChallenge', () => {
        it('rejects invalid IDs before querying', async () => {
            const findSpy = jest.spyOn(Challenge, 'findById');

            await expect(
                getSolutionsForChallenge('invalid-id', userId)
            ).rejects.toThrow('INVALID_ID');

            expect(findSpy).not.toHaveBeenCalled();
        });

        it('rejects a challenge that does not exist', async () => {
            jest.spyOn(Challenge, 'findById')
                .mockResolvedValue(null);

            await expect(
                getSolutionsForChallenge(challengeId, userId)
            ).rejects.toThrow('CHALLENGE_NOT_FOUND');
        });

        it('allows an administrator to retrieve all challenge solutions', async () => {
            const challenge = {
                _id: new mongoose.Types.ObjectId(challengeId),
            };
            const solutions = [
                makeSolution(),
                makeSolution({
                    _id: new mongoose.Types.ObjectId(),
                    team: new mongoose.Types.ObjectId(),
                }),
            ];

            jest.spyOn(Challenge, 'findById')
                .mockResolvedValue(challenge as never);

            const query = createQuery(solutions);
            const findSpy = jest.spyOn(Solution, 'find')
                .mockReturnValue(query as never);
            const membershipSpy = jest.spyOn(TeamMember, 'find');

            const result = await getSolutionsForChallenge(
                challengeId,
                userId,
                true
            );

            expect(result).toBe(solutions);
            expect(findSpy).toHaveBeenCalledWith({
                challenge: challenge._id,
            });
            expect(membershipSpy).not.toHaveBeenCalled();
        });

        it('limits regular users to solutions belonging to their teams', async () => {
            const challenge = {
                _id: new mongoose.Types.ObjectId(challengeId),
            };
            const membershipQuery = createQuery([
                { team: new mongoose.Types.ObjectId(teamId) },
            ]);
            const solutions = [makeSolution()];
            const solutionQuery = createQuery(solutions);

            jest.spyOn(Challenge, 'findById')
                .mockResolvedValue(challenge as never);

            const membershipSpy = jest.spyOn(TeamMember, 'find')
                .mockReturnValue(membershipQuery as never);

            const findSolutionsSpy = jest.spyOn(Solution, 'find')
                .mockReturnValue(solutionQuery as never);

            const result = await getSolutionsForChallenge(
                challengeId,
                userId
            );

            expect(result).toBe(solutions);
            expect(membershipSpy).toHaveBeenCalledWith({
                user: userId,
            });
            expect(findSolutionsSpy).toHaveBeenCalledWith({
                challenge: challenge._id,
                team: {
                    $in: [new mongoose.Types.ObjectId(teamId)],
                },
            });
        });

        it('returns no solutions when the user has no team memberships', async () => {
            const challenge = {
                _id: new mongoose.Types.ObjectId(challengeId),
            };

            jest.spyOn(Challenge, 'findById')
                .mockResolvedValue(challenge as never);

            jest.spyOn(TeamMember, 'find')
                .mockReturnValue(createQuery([]) as never);

            const query = createQuery([]);
            const findSolutionsSpy = jest.spyOn(Solution, 'find')
                .mockReturnValue(query as never);

            const result = await getSolutionsForChallenge(
                challengeId,
                userId
            );

            expect(result).toEqual([]);
            expect(findSolutionsSpy).toHaveBeenCalledWith({
                challenge: challenge._id,
                team: { $in: [] },
            });
        });
    });
});





describe('Solution service — review', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const solutionId = '507f1f77bcf86cd799439011';
    const reviewerId = '507f191e810c19729de860ea';

    const makeSolution = (reviewStatus: string) => ({
        reviewStatus,
        reviewedBy: undefined,
        reviewNote: undefined as string | undefined,
        reviewedAt: undefined as Date | undefined,
        history: [] as Array<Record<string, unknown>>,
        save: jest.fn().mockResolvedValue(undefined),
    });

    it('approves a pending solution and records review history', async () => {
        const solution = makeSolution('PENDING');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);

        const result = await reviewSolution(
            solutionId,
            'APPROVED',
            reviewerId,
            'The proposal meets the requirements.'
        );

        expect(result.reviewStatus).toBe('APPROVED');
        expect(result.reviewedBy).toEqual(
            new mongoose.Types.ObjectId(reviewerId)
        );
        expect(result.reviewNote).toBe(
            'The proposal meets the requirements.'
        );
        expect(result.reviewedAt).toBeInstanceOf(Date);

        expect(result.history).toHaveLength(1);
        expect(result.history[0]).toEqual(expect.objectContaining({
            action: 'REVIEWED',
            from: 'PENDING',
            to: 'APPROVED',
            note: 'The proposal meets the requirements.',
        }));

        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it('allows a revision-requested solution to be reviewed again', async () => {
        const solution = makeSolution('REVISION_REQUESTED');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);

        const result = await reviewSolution(
            solutionId,
            'APPROVED',
            reviewerId,
            'Revisions look good.'
        );

        expect(result.reviewStatus).toBe('APPROVED');
        expect(result.history).toHaveLength(1);
        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it('records the correct history action when requesting revisions', async () => {
        const solution = makeSolution('PENDING');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);

        const result = await reviewSolution(
            solutionId,
            'REVISION_REQUESTED',
            reviewerId,
            'Please clarify the maintenance plan.'
        );

        expect(result.reviewStatus).toBe('REVISION_REQUESTED');
        expect(result.history[0]).toEqual(expect.objectContaining({
            action: 'REVISION_REQUESTED',
            to: 'REVISION_REQUESTED',
            note: 'Please clarify the maintenance plan.',
        }));

        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it('allows a solution to be rejected', async () => {
        const solution = makeSolution('PENDING');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);

        const result = await reviewSolution(
            solutionId,
            'REJECTED',
            reviewerId,
            'The proposal is not feasible.'
        );

        expect(result.reviewStatus).toBe('REJECTED');
        expect(result.history[0]).toEqual(expect.objectContaining({
            action: 'REVIEWED',
            to: 'REJECTED',
        }));

        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it.each(['APPROVED', 'REJECTED', 'OTHER_STATUS'])(
        'rejects reviewing a solution in status %s',
        async (reviewStatus) => {
            const solution = makeSolution(reviewStatus);

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);

            await expect(reviewSolution(
                solutionId,
                'APPROVED',
                reviewerId
            )).rejects.toThrow('SOLUTION_NOT_REVIEWABLE');

            expect(solution.save).not.toHaveBeenCalled();
        }
    );

    it('rejects reviewing a solution that does not exist', async () => {
        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(null);

        await expect(reviewSolution(
            solutionId,
            'APPROVED',
            reviewerId
        )).rejects.toThrow('SOLUTION_NOT_FOUND');
    });

    it('rejects invalid solution IDs', async () => {
        const findSpy = jest.spyOn(Solution, 'findById');

        await expect(reviewSolution(
            'invalid-id',
            'APPROVED',
            reviewerId
        )).rejects.toThrow('INVALID_ID');

        expect(findSpy).not.toHaveBeenCalled();
    });

    it('rejects invalid reviewer IDs', async () => {
        const findSpy = jest.spyOn(Solution, 'findById');

        await expect(reviewSolution(
            solutionId,
            'APPROVED',
            'invalid-id'
        )).rejects.toThrow('INVALID_ID');

        expect(findSpy).not.toHaveBeenCalled();
    });
});



describe('Solution service — implementation lifecycle', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const solutionId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';
    const teamId = '507f1f77bcf86cd799439012';

    const makeSolution = (
        implementationStatus = 'NOT_STARTED',
        reviewStatus = 'APPROVED'
    ) => ({
        team: new mongoose.Types.ObjectId(teamId),
        reviewStatus,
        implementationStatus,
        history: [] as Array<Record<string, unknown>>,
        save: jest.fn().mockResolvedValue(undefined),
    });

    const mockMembership = () => {
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ team: teamId, user: userId } as never);
    };

    it('allows an approved solution to start implementation', async () => {
        const solution = makeSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        const result = await updateSolutionImplementationStatus(
            solutionId,
            'IN_PROGRESS',
            userId
        );

        expect(result.implementationStatus).toBe('IN_PROGRESS');
        expect(result.history).toHaveLength(1);
        expect(result.history[0]).toEqual(expect.objectContaining({
            action: 'IMPLEMENTATION_STATUS_CHANGED',
            from: 'NOT_STARTED',
            to: 'IN_PROGRESS',
        }));
        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it('rejects changes when the solution does not exist', async () => {
        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(null);

        await expect(updateSolutionImplementationStatus(
            solutionId,
            'IN_PROGRESS',
            userId
        )).rejects.toThrow('SOLUTION_NOT_FOUND');
    });

    it('rejects changes by someone who is not a team member', async () => {
        const solution = makeSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue(null);

        await expect(updateSolutionImplementationStatus(
            solutionId,
            'IN_PROGRESS',
            userId
        )).rejects.toThrow('NOT_A_TEAM_MEMBER');

        expect(solution.save).not.toHaveBeenCalled();
    });

    it('rejects implementation changes before approval', async () => {
        const solution = makeSolution('NOT_STARTED', 'PENDING');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        await expect(updateSolutionImplementationStatus(
            solutionId,
            'IN_PROGRESS',
            userId
        )).rejects.toThrow('SOLUTION_NOT_APPROVED');

        expect(solution.save).not.toHaveBeenCalled();
    });

    it('allows an approved solution to be put on hold', async () => {
        const solution = makeSolution('IN_PROGRESS');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        const result = await updateSolutionImplementationStatus(
            solutionId,
            'ON_HOLD',
            userId
        );

        expect(result.implementationStatus).toBe('ON_HOLD');
        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it('allows an approved solution to be marked completed', async () => {
        const solution = makeSolution('IN_PROGRESS');

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        const result = await updateSolutionImplementationStatus(
            solutionId,
            'COMPLETED',
            userId
        );

        expect(result.implementationStatus).toBe('COMPLETED');
        expect(result.history[0]).toEqual(expect.objectContaining({
            from: 'IN_PROGRESS',
            to: 'COMPLETED',
        }));
        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it.each(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD'] as const)(
        'prevents reopening a completed solution to %s',
        async (nextStatus) => {
            const solution = makeSolution('COMPLETED');

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(updateSolutionImplementationStatus(
                solutionId,
                nextStatus,
                userId
            )).rejects.toThrow('SOLUTION_ALREADY_COMPLETED');

            expect(solution.save).not.toHaveBeenCalled();
        }
    );

    it('rejects invalid IDs before querying the database', async () => {
        const findSpy = jest.spyOn(Solution, 'findById');

        await expect(updateSolutionImplementationStatus(
            'invalid-id',
            'IN_PROGRESS',
            userId
        )).rejects.toThrow('INVALID_ID');

        expect(findSpy).not.toHaveBeenCalled();
    });
});



describe('recordSolutionImpact', () => {
    const solutionId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();
    const teamId = new mongoose.Types.ObjectId();
    const evidenceKey = 'solutions/evidence/impact-1.jpg';

    const createMockSolution = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(solutionId),
        team: teamId,
        reviewStatus: 'APPROVED',
        implementationStatus: 'IN_PROGRESS',
        evidence: [{ key: evidenceKey }],
        impactIndicators: [] as Array<Record<string, unknown>>,
        history: [] as Array<Record<string, unknown>>,
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('records an impact indicator and adds history', async () => {
        const solution = createMockSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);

        const result = await recordSolutionImpact(solutionId, userId, {
            name: 'People receiving clean water',
            description: 'Residents benefiting from the project',
            unit: 'people',
            baselineValue: 0,
            measuredValue: 150,
            evidenceKeys: [evidenceKey],
        });

        expect(result).toBe(solution);
        expect(solution.impactIndicators).toHaveLength(1);
        expect(solution.impactIndicators[0]).toMatchObject({
            name: 'People receiving clean water',
            unit: 'people',
            baselineValue: 0,
            measuredValue: 150,
            evidenceKeys: [evidenceKey],
        });
        expect(solution.history).toHaveLength(1);
        expect(solution.history[0]).toMatchObject({
            action: 'IMPACT_RECORDED',
            note: 'Impact recorded: People receiving clean water',
        });
        expect(solution.save).toHaveBeenCalledTimes(1);
    });

    it('uses an empty evidence list when none is provided', async () => {
        const solution = createMockSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);

        await recordSolutionImpact(solutionId, userId, {
            name: 'Waste reduced',
            unit: 'kg',
            measuredValue: 25,
        });

        expect(solution.impactIndicators[0]).toMatchObject({
            name: 'Waste reduced',
            unit: 'kg',
            evidenceKeys: [],
        });
    });

    it('rejects evidence that does not belong to the solution', async () => {
        const solution = createMockSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);

        await expect(
            recordSolutionImpact(solutionId, userId, {
                name: 'Waste reduced',
                unit: 'kg',
                evidenceKeys: ['unrelated/evidence.jpg'],
            })
        ).rejects.toThrow('EVIDENCE_NOT_BELONG_TO_SOLUTION');

        expect(solution.save).not.toHaveBeenCalled();
    });

    it('rejects a missing solution', async () => {
        jest.spyOn(Solution, 'findById').mockResolvedValue(null as never);

        await expect(
            recordSolutionImpact(solutionId, userId, {
                name: 'Waste reduced',
                unit: 'kg',
            })
        ).rejects.toThrow('SOLUTION_NOT_FOUND');
    });

    it('rejects a user who is not a team member', async () => {
        const solution = createMockSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne').mockResolvedValue(null as never);

        await expect(
            recordSolutionImpact(solutionId, userId, {
                name: 'Waste reduced',
                unit: 'kg',
            })
        ).rejects.toThrow('NOT_A_TEAM_MEMBER');
    });

    it('rejects impact recording for an unapproved solution', async () => {
        const solution = createMockSolution({
            reviewStatus: 'PENDING',
        });

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);

        await expect(
            recordSolutionImpact(solutionId, userId, {
                name: 'Waste reduced',
                unit: 'kg',
            })
        ).rejects.toThrow('SOLUTION_NOT_APPROVED');
    });

    it('rejects impact recording for a completed solution', async () => {
        const solution = createMockSolution({
            implementationStatus: 'COMPLETED',
        });

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as never);

        await expect(
            recordSolutionImpact(solutionId, userId, {
                name: 'Waste reduced',
                unit: 'kg',
            })
        ).rejects.toThrow('SOLUTION_ALREADY_COMPLETED');
    });


    it('rejects invalid IDs before querying the database', async () => {
        const findByIdSpy = jest.spyOn(Solution, 'findById');

        await expect(
            recordSolutionImpact('invalid-id', userId, {
                name: 'Waste reduced',
                unit: 'kg',
            })
        ).rejects.toThrow('INVALID_ID');

        expect(findByIdSpy).not.toHaveBeenCalled();
    });

});




describe('Solution service — milestones', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const solutionId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';
    const teamId = '507f1f77bcf86cd799439012';
    const milestoneId = '507f1f77bcf86cd799439013';

    const makeMilestone = (status = 'PENDING') => ({
        _id: new mongoose.Types.ObjectId(milestoneId),
        title: 'Install first filter',
        status,
        completedAt: undefined as Date | undefined,
    });

    const makeSolution = (
        reviewStatus = 'APPROVED',
        implementationStatus = 'IN_PROGRESS',
        milestones = [makeMilestone()]
    ) => ({
        team: new mongoose.Types.ObjectId(teamId),
        reviewStatus,
        implementationStatus,
        milestones,
        history: [] as Array<Record<string, unknown>>,
        save: jest.fn().mockResolvedValue(undefined),
    });

    const mockMembership = () => {
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({
                team: teamId,
                user: userId,
            } as never);
    };

    describe('adding milestones', () => {
        it('adds a pending milestone and records history', async () => {
            const solution = makeSolution(
                'APPROVED',
                'IN_PROGRESS',
                []
            );

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            const result = await addSolutionMilestone(
                solutionId,
                'Install first filter',
                userId,
                'Install a filter at the main water point.'
            );

            expect(result.milestones).toHaveLength(1);
            expect(result.milestones[0]).toMatchObject({
                title: 'Install first filter',
                status: 'PENDING',
            });
            expect(result.history).toHaveLength(1);
            expect(result.history[0]).toMatchObject({
                action: 'MILESTONE_UPDATED',
            });
            expect(solution.save).toHaveBeenCalledTimes(1);
        });

        it('prevents reopening a completed milestone', async () => {
            const solution = makeSolution(
                'APPROVED',
                'IN_PROGRESS',
                [makeMilestone('COMPLETED')]
            );

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);

            mockMembership();

            await expect(
                updateSolutionMilestone(
                    solutionId,
                    milestoneId,
                    'IN_PROGRESS',
                    userId
                )
            ).rejects.toThrow('MILESTONE_ALREADY_COMPLETED');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects adding a milestone when the solution does not exist', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(null);

            await expect(
                addSolutionMilestone(
                    solutionId,
                    'Install first filter',
                    userId
                )
            ).rejects.toThrow('SOLUTION_NOT_FOUND');
        });

        it('rejects adding a milestone by a non-member', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            jest.spyOn(TeamMember, 'findOne')
                .mockResolvedValue(null);

            await expect(
                addSolutionMilestone(
                    solutionId,
                    'Install first filter',
                    userId
                )
            ).rejects.toThrow('NOT_A_TEAM_MEMBER');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects adding a milestone before approval', async () => {
            const solution = makeSolution('PENDING');

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(
                addSolutionMilestone(
                    solutionId,
                    'Install first filter',
                    userId
                )
            ).rejects.toThrow('SOLUTION_NOT_APPROVED');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects adding a milestone to a completed solution', async () => {
            const solution = makeSolution(
                'APPROVED',
                'COMPLETED'
            );

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(
                addSolutionMilestone(
                    solutionId,
                    'Install first filter',
                    userId
                )
            ).rejects.toThrow('SOLUTION_ALREADY_COMPLETED');

            expect(solution.save).not.toHaveBeenCalled();
        });
    });

    describe('updating milestones', () => {
        it('updates a milestone to IN_PROGRESS', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            const result = await updateSolutionMilestone(
                solutionId,
                milestoneId,
                'IN_PROGRESS',
                userId
            );

            expect(result.milestones[0].status).toBe('IN_PROGRESS');
            expect(result.history).toHaveLength(1);
            expect(result.history[0]).toMatchObject({
                action: 'MILESTONE_UPDATED',
            });
            expect(solution.save).toHaveBeenCalledTimes(1);
        });

        it('sets completedAt when a milestone is completed', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            const result = await updateSolutionMilestone(
                solutionId,
                milestoneId,
                'COMPLETED',
                userId
            );

            expect(result.milestones[0].status).toBe('COMPLETED');
            expect(result.milestones[0].completedAt)
                .toBeInstanceOf(Date);
            expect(solution.save).toHaveBeenCalledTimes(1);
        });

        it('rejects an unknown milestone ID', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(
                updateSolutionMilestone(
                    solutionId,
                    '507f1f77bcf86cd799439099',
                    'COMPLETED',
                    userId
                )
            ).rejects.toThrow('MILESTONE_NOT_FOUND');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects updates by a non-member', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            jest.spyOn(TeamMember, 'findOne')
                .mockResolvedValue(null);

            await expect(
                updateSolutionMilestone(
                    solutionId,
                    milestoneId,
                    'IN_PROGRESS',
                    userId
                )
            ).rejects.toThrow('NOT_A_TEAM_MEMBER');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects updates before approval', async () => {
            const solution = makeSolution('PENDING');

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(
                updateSolutionMilestone(
                    solutionId,
                    milestoneId,
                    'IN_PROGRESS',
                    userId
                )
            ).rejects.toThrow('SOLUTION_NOT_APPROVED');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects updates to milestones on a completed solution', async () => {
            const solution = makeSolution(
                'APPROVED',
                'COMPLETED'
            );

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(
                updateSolutionMilestone(
                    solutionId,
                    milestoneId,
                    'IN_PROGRESS',
                    userId
                )
            ).rejects.toThrow('SOLUTION_ALREADY_COMPLETED');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects invalid milestone IDs before querying the database', async () => {
            const findSpy = jest.spyOn(Solution, 'findById');

            await expect(
                updateSolutionMilestone(
                    solutionId,
                    'invalid-id',
                    'COMPLETED',
                    userId
                )
            ).rejects.toThrow('INVALID_ID');

            expect(findSpy).not.toHaveBeenCalled();
        });
    });
});




describe('Solution service — evidence', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const solutionId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';
    const teamId = new mongoose.Types.ObjectId();
    const evidenceKey = `solutions/${solutionId}/evidence-1.jpg`;


    const makeSolution = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(solutionId),
        team: teamId,
        submittedBy: new mongoose.Types.ObjectId(userId),
        reviewStatus: 'APPROVED',
        implementationStatus: 'IN_PROGRESS',
        evidence: [] as Array<Record<string, unknown>>,
        history: [] as Array<Record<string, unknown>>,
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    });


    const mockMembership = () => {
        jest.spyOn(TeamMember, 'findOne')
            .mockResolvedValue({ team: teamId, user: userId } as never);
    };



    describe('createSolutionEvidenceUpload', () => {

        it.each([
            'PENDING',
            'REJECTED',
            'REVISION_REQUESTED',
        ] as const)(
            'rejects uploads when review status is %s',
            async (reviewStatus) => {
                jest.spyOn(Solution, 'findById')
                    .mockResolvedValue(
                        makeSolution({ reviewStatus }) as never
                    );
                mockMembership();

                await expect(createSolutionEvidenceUpload(
                    solutionId,
                    userId,
                    'filter.jpg',
                    'image/jpeg',
                    100
                )).rejects.toThrow('SOLUTION_NOT_APPROVED');
            }
        );
        it('creates a unique key for an allowed image', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            const result = await createSolutionEvidenceUpload(
                solutionId,
                userId,
                'filter.jpg',
                'image/jpeg',
                1024
            );

            expect(result.key).toMatch(
                new RegExp(`^solutions/${solutionId}/[\\w-]+\\.jpg$`)
            );
            expect(result.originalName).toBe('filter.jpg');
            expect(result.contentType).toBe('image/jpeg');
            expect(result.size).toBe(1024);
        });

        it('rejects an unsupported file type', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(makeSolution() as never);
            mockMembership();

            await expect(createSolutionEvidenceUpload(
                solutionId, userId, 'script.svg', 'image/svg+xml', 100
            )).rejects.toThrow('UNSUPPORTED_FILE_TYPE');
        });

        it('rejects files larger than 10 MB', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(makeSolution() as never);
            mockMembership();

            await expect(createSolutionEvidenceUpload(
                solutionId, userId, 'large.jpg', 'image/jpeg',
                10 * 1024 * 1024 + 1
            )).rejects.toThrow('INVALID_FILE_SIZE');
        });

        it('rejects users who are not team members', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(makeSolution() as never);
            jest.spyOn(TeamMember, 'findOne').mockResolvedValue(null);

            await expect(createSolutionEvidenceUpload(
                solutionId, userId, 'filter.jpg', 'image/jpeg', 100
            )).rejects.toThrow('NOT_A_TEAM_MEMBER');
        });

        it('rejects a missing solution', async () => {
            jest.spyOn(Solution, 'findById').mockResolvedValue(null);

            await expect(createSolutionEvidenceUpload(
                solutionId, userId, 'filter.jpg', 'image/jpeg', 100
            )).rejects.toThrow('SOLUTION_NOT_FOUND');
        });

        it('rejects uploads for completed solutions', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(
                    makeSolution({ implementationStatus: 'COMPLETED' }) as never
                );
            mockMembership();

            await expect(createSolutionEvidenceUpload(
                solutionId, userId, 'filter.jpg', 'image/jpeg', 100
            )).rejects.toThrow('SOLUTION_ALREADY_COMPLETED');
        });
    });

    describe('attachSolutionEvidence', () => {
        it('attaches evidence and records history', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            const result = await attachSolutionEvidence(
                solutionId,
                userId,
                {
                    key: evidenceKey,
                    originalName: 'filter.jpg',
                    contentType: 'image/jpeg',
                    size: 1024,
                }
            );

            expect(result.evidence).toHaveLength(1);
            expect(result.evidence[0]).toMatchObject({
                key: evidenceKey,
                originalName: 'filter.jpg',
                contentType: 'image/jpeg',
                size: 1024,
            });
            expect(result.history[0]).toMatchObject({
                action: 'EVIDENCE_ADDED',
            });
            expect(solution.save).toHaveBeenCalledTimes(1);
        });

        it.each([
            'PENDING',
            'REJECTED',
            'REVISION_REQUESTED',
        ] as const)(
            'rejects attaching evidence when review status is %s',
            async (reviewStatus) => {
                const solution = makeSolution({ reviewStatus });

                jest.spyOn(Solution, 'findById')
                    .mockResolvedValue(solution as never);
                mockMembership();

                await expect(attachSolutionEvidence(
                    solutionId,
                    userId,
                    {
                        key: evidenceKey,
                        originalName: 'filter.jpg',
                        contentType: 'image/jpeg',
                        size: 100,
                    }
                )).rejects.toThrow('SOLUTION_NOT_APPROVED');

                expect(solution.save).not.toHaveBeenCalled();
            }
        );

        it('rejects an evidence key outside the solution prefix', async () => {
            const solution = makeSolution();

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(attachSolutionEvidence(
                solutionId, userId, {
                key: 'problems/another-id/photo.jpg',
                originalName: 'photo.jpg',
                contentType: 'image/jpeg',
                size: 100,
            }
            )).rejects.toThrow('INVALID_EVIDENCE_KEY');

            expect(solution.save).not.toHaveBeenCalled();
        });

        it('rejects attaching the same evidence twice', async () => {
            const solution = makeSolution({
                evidence: [{ key: evidenceKey }],
            });

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            await expect(attachSolutionEvidence(
                solutionId, userId, {
                key: evidenceKey,
                originalName: 'filter.jpg',
                contentType: 'image/jpeg',
                size: 100,
            }
            )).rejects.toThrow('EVIDENCE_ALREADY_ATTACHED');
        });

        it('rejects non-members', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(makeSolution() as never);
            jest.spyOn(TeamMember, 'findOne').mockResolvedValue(null);

            await expect(attachSolutionEvidence(
                solutionId, userId, {
                key: evidenceKey,
                originalName: 'filter.jpg',
                contentType: 'image/jpeg',
                size: 100,
            }
            )).rejects.toThrow('NOT_A_TEAM_MEMBER');
        });
    });


    it('rejects an evidence key belonging to another solution', async () => {
        const solution = makeSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        await expect(attachSolutionEvidence(
            solutionId, userId, {
            key: 'solutions/507f1f77bcf86cd799439099/photo.jpg',
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            size: 100,
        }
        )).rejects.toThrow('INVALID_EVIDENCE_KEY');

        expect(solution.save).not.toHaveBeenCalled();
    });

    it('rejects an evidence key containing nested path segments', async () => {
        const solution = makeSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        await expect(attachSolutionEvidence(
            solutionId, userId, {
            key: `solutions/${solutionId}/nested/photo.jpg`,
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            size: 100,
        }
        )).rejects.toThrow('INVALID_EVIDENCE_KEY');

        expect(solution.save).not.toHaveBeenCalled();
    });

    it('rejects an evidence key containing backslashes', async () => {
        const solution = makeSolution();

        jest.spyOn(Solution, 'findById')
            .mockResolvedValue(solution as never);
        mockMembership();

        await expect(attachSolutionEvidence(
            solutionId, userId, {
            key: `solutions/${solutionId}/nested\\photo.jpg`,
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            size: 100,
        }
        )).rejects.toThrow('INVALID_EVIDENCE_KEY');

        expect(solution.save).not.toHaveBeenCalled();
    });


    describe('getSolutionEvidence', () => {
        it('returns evidence belonging to the solution for a team member', async () => {
            const solution = makeSolution({
                evidence: [{
                    key: evidenceKey,
                    originalName: 'filter.jpg',
                    contentType: 'image/jpeg',
                    size: 100,
                }],
            });

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            mockMembership();

            const result = await getSolutionEvidence(
                solutionId, userId, evidenceKey
            );

            expect(result).toMatchObject({
                key: evidenceKey,
                originalName: 'filter.jpg',
            });
        });


        it('allows an administrator to retrieve evidence without team membership', async () => {
            const solution = makeSolution({
                submittedBy: new mongoose.Types.ObjectId(
                    '507f191e810c19729de860eb'
                ),
                evidence: [{
                    key: evidenceKey,
                    originalName: 'filter.jpg',
                    contentType: 'image/jpeg',
                    size: 100,
                }],
            });

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            jest.spyOn(TeamMember, 'findOne')
                .mockResolvedValue(null);

            const result = await getSolutionEvidence(
                solutionId,
                userId,
                evidenceKey,
                true
            );

            expect(result).toMatchObject({
                key: evidenceKey,
                originalName: 'filter.jpg',
            });

            expect(TeamMember.findOne).not.toHaveBeenCalled();
        });


        it('rejects evidence that does not belong to the solution', async () => {
            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(makeSolution() as never);
            mockMembership();

            await expect(getSolutionEvidence(
                solutionId, userId, evidenceKey
            )).rejects.toThrow('EVIDENCE_NOT_FOUND');
        });

        it('rejects users without access', async () => {
            const solution = makeSolution({
                submittedBy: new mongoose.Types.ObjectId(
                    '507f191e810c19729de860eb'
                ),
                evidence: [{ key: evidenceKey }],
            });

            jest.spyOn(Solution, 'findById')
                .mockResolvedValue(solution as never);
            jest.spyOn(TeamMember, 'findOne').mockResolvedValue(null);

            await expect(getSolutionEvidence(
                solutionId, userId, evidenceKey
            )).rejects.toThrow('NOT_A_TEAM_MEMBER');
        });
    });
});
