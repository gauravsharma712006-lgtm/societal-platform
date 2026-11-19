
import mongoose from 'mongoose';
import { Solution } from '../models/solution.model';
import { Challenge } from '../models/challenge.model';
import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import crypto from 'crypto';

interface CreateSolutionInput {
    challenge: string;
    team: string;
    title: string;
    description: string;
    approach: string;
    estimatedCost?: number;
    estimatedCompletionDate?: Date;
}

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

export const createSolution = async (
    input: CreateSolutionInput,
    userId: string
) => {
    if (!isValidObjectId(input.challenge) ||
        !isValidObjectId(input.team) ||
        !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const [challenge, team, membership] = await Promise.all([
        Challenge.findById(input.challenge),
        Team.findById(input.team),
        TeamMember.findOne({
            team: input.team,
            user: userId,
        }),
    ]);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (!team) {
        throw new Error('TEAM_NOT_FOUND');
    }

    if (team.challenge.toString() !== challenge._id.toString()) {
        throw new Error('TEAM_CHALLENGE_MISMATCH');
    }

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (team.status !== 'ACTIVE') {
        throw new Error('TEAM_NOT_ACTIVE');
    }

    if (challenge.status !== 'OPEN' && challenge.status !== 'IN_PROGRESS') {
        throw new Error('CHALLENGE_NOT_OPEN');
    }

    const solution = await Solution.create({
        challenge: challenge._id,
        team: team._id,
        submittedBy: new mongoose.Types.ObjectId(userId),
        title: input.title,
        description: input.description,
        approach: input.approach,
        estimatedCost: input.estimatedCost,
        estimatedCompletionDate: input.estimatedCompletionDate,
        reviewStatus: 'PENDING',
        implementationStatus: 'NOT_STARTED',
        history: [{
            action: 'SUBMITTED',
            changedBy: new mongoose.Types.ObjectId(userId),
        }],
    });

    return solution;
};


export const getSolutionById = async (
    solutionId: string,
    userId: string,
    isAdmin = false
) => {
    if (
        !isValidObjectId(solutionId) ||
        !isValidObjectId(userId)
    ) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId)
        .populate('challenge')
        .populate('team')
        .populate('submittedBy', 'name email role')
        .populate('reviewedBy', 'name email role');

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    if (isAdmin) {
        return solution;
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    const isSubmitter =
        solution.submittedBy._id?.toString?.() === userId ||
        solution.submittedBy.toString() === userId;

    if (!membership && !isSubmitter) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    return solution;
};

export const getSolutionsForChallenge = async (
    challengeId: string,
    userId: string,
    isAdmin = false
) => {
    if (
        !isValidObjectId(challengeId) ||
        !isValidObjectId(userId)
    ) {
        throw new Error('INVALID_ID');
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (isAdmin) {
        return Solution.find({ challenge: challenge._id })
            .sort({ createdAt: -1 })
            .populate('team', 'name status')
            .populate('submittedBy', 'name role');
    }

    const memberships = await TeamMember.find({
        user: userId,
    }).select('team');

    const teamIds = memberships.map(
        (membership) => membership.team
    );

    return Solution.find({
        challenge: challenge._id,
        team: { $in: teamIds },
    })
        .sort({ createdAt: -1 })
        .populate('team', 'name status')
        .populate('submittedBy', 'name role');
};


export const reviewSolution = async (
    solutionId: string,
    reviewStatus: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
    reviewerId: string,
    reviewNote?: string
) => {
    if (!isValidObjectId(solutionId) ||
        !isValidObjectId(reviewerId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    if (
        solution.reviewStatus !== 'PENDING' &&
        solution.reviewStatus !== 'REVISION_REQUESTED'
    ) {
        throw new Error('SOLUTION_NOT_REVIEWABLE');
    }


    const previousReviewStatus = solution.reviewStatus;
    solution.reviewStatus = reviewStatus;
    solution.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    solution.reviewNote = reviewNote;
    solution.reviewedAt = new Date();

    solution.history.push({
        action: reviewStatus === 'REVISION_REQUESTED'
            ? 'REVISION_REQUESTED'
            : 'REVIEWED',
        from: previousReviewStatus,
        to: reviewStatus,
        changedBy: new mongoose.Types.ObjectId(reviewerId),
        note: reviewNote,
        changedAt: new Date(),
    });

    await solution.save();

    return solution;
};



export const updateSolutionImplementationStatus = async (
    solutionId: string,
    implementationStatus:
        | 'NOT_STARTED'
        | 'IN_PROGRESS'
        | 'ON_HOLD'
        | 'COMPLETED',
    userId: string
) => {
    if (!isValidObjectId(solutionId) || !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (solution.reviewStatus !== 'APPROVED') {
        throw new Error('SOLUTION_NOT_APPROVED');
    }

    if (
        solution.implementationStatus === 'COMPLETED' &&
        implementationStatus !== 'COMPLETED'
    ) {
        throw new Error('SOLUTION_ALREADY_COMPLETED');
    }



    const previousStatus = solution.implementationStatus;

    solution.implementationStatus = implementationStatus;

    solution.history.push({
        action: 'IMPLEMENTATION_STATUS_CHANGED',
        from: previousStatus,
        to: implementationStatus,
        changedBy: new mongoose.Types.ObjectId(userId),
        changedAt: new Date(),
    });

    await solution.save();

    return solution;
};

export const addSolutionMilestone = async (
    solutionId: string,
    title: string,
    userId: string,
    description?: string,
    dueDate?: Date
) => {
    if (!isValidObjectId(solutionId) || !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (solution.reviewStatus !== 'APPROVED') {
        throw new Error('SOLUTION_NOT_APPROVED');
    }

    if (
        solution.implementationStatus === 'COMPLETED'
    ) {
        throw new Error('SOLUTION_ALREADY_COMPLETED');
    }

    solution.milestones.push({
        title,
        description,
        dueDate,
        status: 'PENDING',
    });

    solution.history.push({
        action: 'MILESTONE_UPDATED',
        changedBy: new mongoose.Types.ObjectId(userId),
        note: `Milestone added: ${title}`,
        changedAt: new Date(),
    });

    await solution.save();

    return solution;
};



export const updateSolutionMilestone = async (
    solutionId: string,
    milestoneId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    userId: string
) => {
    if (
        !isValidObjectId(solutionId) ||
        !isValidObjectId(milestoneId) ||
        !isValidObjectId(userId)
    ) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (solution.reviewStatus !== 'APPROVED') {
        throw new Error('SOLUTION_NOT_APPROVED');
    }

    if (solution.implementationStatus === 'COMPLETED') {
        throw new Error('SOLUTION_ALREADY_COMPLETED');
    }

    const milestone = solution.milestones.find(
        (item) => item._id?.toString() === milestoneId
    );

    if (!milestone) {
        throw new Error('MILESTONE_NOT_FOUND');
    }

    if (milestone.status === 'COMPLETED') {
        throw new Error('MILESTONE_ALREADY_COMPLETED');
    }

    milestone.status = status;
    milestone.completedAt =
        status === 'COMPLETED' ? new Date() : undefined;

    solution.history.push({
        action: 'MILESTONE_UPDATED',
        from: undefined,
        to: status,
        changedBy: new mongoose.Types.ObjectId(userId),
        note: `Milestone updated: ${milestone.title}`,
        changedAt: new Date(),
    });

    await solution.save();

    return solution;
};



export const recordSolutionImpact = async (
    solutionId: string,
    userId: string,
    input: {
        name: string;
        description?: string;
        unit: string;
        baselineValue?: number;
        measuredValue?: number;
        measuredAt?: Date;
        notes?: string;
        evidenceKeys?: string[];
    }
) => {
    if (!isValidObjectId(solutionId) || !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (solution.reviewStatus !== 'APPROVED') {
        throw new Error('SOLUTION_NOT_APPROVED');
    }

    if (solution.implementationStatus === 'COMPLETED') {
        throw new Error('SOLUTION_ALREADY_COMPLETED');
    }

    const evidenceKeys = input.evidenceKeys ?? [];

    const ownedEvidenceKeys = new Set(
        solution.evidence.map((evidence) => evidence.key)
    );

    const hasUnownedEvidence = evidenceKeys.some(
        (key) => !ownedEvidenceKeys.has(key)
    );

    if (hasUnownedEvidence) {
        throw new Error('EVIDENCE_NOT_BELONG_TO_SOLUTION');
    }

    solution.impactIndicators.push({
        name: input.name,
        description: input.description,
        unit: input.unit,
        baselineValue: input.baselineValue,
        measuredValue: input.measuredValue,
        measuredAt: input.measuredAt,
        notes: input.notes,
        evidenceKeys,
    });

    solution.history.push({
        action: 'IMPACT_RECORDED',
        changedBy: new mongoose.Types.ObjectId(userId),
        note: `Impact recorded: ${input.name}`,
        changedAt: new Date(),
    });

    await solution.save();

    return solution;
};




export const createSolutionEvidenceUpload = async (
    solutionId: string,
    userId: string,
    fileName: string,
    contentType: string,
    size: number
) => {
    if (!isValidObjectId(solutionId) || !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (solution.reviewStatus !== 'APPROVED') {
        throw new Error('SOLUTION_NOT_APPROVED');
    }

    if (solution.implementationStatus === 'COMPLETED') {
        throw new Error('SOLUTION_ALREADY_COMPLETED');
    }

    const extensionMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    };

    const extension = extensionMap[contentType];

    if (!extension) {
        throw new Error('UNSUPPORTED_FILE_TYPE');
    }

    if (!Number.isInteger(size) || size < 1 || size > 10 * 1024 * 1024) {
        throw new Error('INVALID_FILE_SIZE');
    }

    const evidenceId = crypto.randomUUID();
    const key = `solutions/${solutionId}/${evidenceId}.${extension}`;

    return {
        key,
        originalName: fileName,
        contentType,
        size,
    };
};

export const attachSolutionEvidence = async (
    solutionId: string,
    userId: string,
    evidence: {
        key: string;
        originalName: string;
        contentType: string;
        size: number;
    }
) => {
    if (!isValidObjectId(solutionId) || !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    if (!membership) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    if (solution.implementationStatus === 'COMPLETED') {
        throw new Error('SOLUTION_ALREADY_COMPLETED');
    }

    if (solution.reviewStatus !== 'APPROVED') {
    throw new Error('SOLUTION_NOT_APPROVED');
}

    const expectedPrefix = `solutions/${solutionId}/`;
    const fileName = evidence.key.startsWith(expectedPrefix)
        ? evidence.key.slice(expectedPrefix.length)
        : '';

    const isValidEvidenceKey =
        fileName.length > 0 &&

        !fileName.includes('/') &&
        !fileName.includes('\\') &&
        fileName !== '.' &&
        fileName !== '..';

    if (!isValidEvidenceKey) {
        throw new Error('INVALID_EVIDENCE_KEY');
    }

    if (solution.evidence.some((item) => item.key === evidence.key)) {
        throw new Error('EVIDENCE_ALREADY_ATTACHED');
    }

    solution.evidence.push({
        ...evidence,
        uploadedAt: new Date(),
    });

    solution.history.push({
        action: 'EVIDENCE_ADDED',
        changedBy: new mongoose.Types.ObjectId(userId),
        note: `Evidence added: ${evidence.originalName}`,
        changedAt: new Date(),
    });

    await solution.save();

    return solution;
};


export const getSolutionEvidence = async (
    solutionId: string,
    userId: string,
    key: string,
    isAdmin = false
) => {
    if (!isValidObjectId(solutionId) || !isValidObjectId(userId)) {
        throw new Error('INVALID_ID');
    }

    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new Error('SOLUTION_NOT_FOUND');
    }

    const evidence = solution.evidence.find(
        (item) => item.key === key
    );

    if (!evidence) {
        throw new Error('EVIDENCE_NOT_FOUND');
    }

    // Administrators may access evidence for moderation.
    if (isAdmin) {
        return evidence;
    }

    const membership = await TeamMember.findOne({
        team: solution.team,
        user: userId,
    });

    const isSubmitter =
        solution.submittedBy.toString() === userId;

    if (!membership && !isSubmitter) {
        throw new Error('NOT_A_TEAM_MEMBER');
    }

    return evidence;
};

