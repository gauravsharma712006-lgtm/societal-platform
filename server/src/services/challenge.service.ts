import mongoose from 'mongoose';
import { Challenge } from '../models/challenge.model';
import { Problem } from '../models/problem.model';

export const createChallenge = async (
    title: string,
    description: string,
    problemId: string,
    deadline: Date,
    skills: string[],
    eligibility: string,
    userId: string
) => {
    const problem = await Problem.findById(problemId);

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }

    if (problem.status !== 'VERIFIED') {
        throw new Error('PROBLEM_NOT_VERIFIED');
    }

    const existingChallenge = await Challenge.findOne({
        problem: problem._id,
        status: {
            $in: [
                'DRAFT',
                'OPEN',
                'IN_PROGRESS',
            ],
        },
    });

    if (existingChallenge) {
        throw new Error('CHALLENGE_ALREADY_EXISTS');
    }

    const challenge = await Challenge.create({
        title,
        description,
        problem: problem._id,
        createdBy: new mongoose.Types.ObjectId(userId),
        status: 'DRAFT',
        deadline,
        skills,
        eligibility,
    });

    return challenge;
};



export const getChallenges = async () => {
    const challenges = await Challenge.find({
        status: {
            $in: [
                'OPEN',
                'IN_PROGRESS',
                'COMPLETED',
            ],
        },
    })
        .populate('problem', 'title description category location status')
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 });

    return challenges;
};



export const getChallengeById = async (
    challengeId: string
) => {
    const challenge = await Challenge.findById(
        challengeId
    )
        .populate(
            'problem',
            'title description category location status'
        )
        .populate(
            'createdBy',
            'name email role'
        );

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (
        challenge.status === 'DRAFT' ||
        challenge.status === 'CANCELLED'
    ) {
        throw new Error('CHALLENGE_NOT_AVAILABLE');
    }

    return challenge;
};





export const updateChallengeStatus = async (
    challengeId: string,
    status:
        | 'OPEN'
        | 'CLOSED'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED'
) => {
    const challenge =
        await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    const currentStatus = challenge.status;

    const allowedTransitions: Record<string, string[]> = {
        DRAFT: ['OPEN', 'CANCELLED'],
        OPEN: ['CLOSED', 'CANCELLED'],
        CLOSED: ['IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED'],
        COMPLETED: [],
        CANCELLED: [],
    };

    const allowedNextStatuses =
        allowedTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
        throw new Error('INVALID_STATUS_TRANSITION');
    }

    challenge.status = status;

    await challenge.save();

    return challenge;
};


export const isChallengeAcceptingApplications = async (
    challengeId: string
): Promise<boolean> => {
    const challenge =
        await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (challenge.status !== 'OPEN') {
        return false;
    }

    if (challenge.deadline.getTime() <= Date.now()) {
        return false;
    }

    return true;
};



export const updateChallenge = async (
    challengeId: string,
    updates: {
        title?: string;
        description?: string;
        deadline?: Date;
        skills?: string[];
        eligibility?: string;
    }
) => {
    const challenge =
        await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (
        challenge.status === 'COMPLETED' ||
        challenge.status === 'CANCELLED'
    ) {
        throw new Error('CHALLENGE_NOT_EDITABLE');
    }

    if (updates.title !== undefined) {
        challenge.title = updates.title;
    }

    if (updates.description !== undefined) {
        challenge.description =
            updates.description;
    }

    if (updates.deadline !== undefined) {
        challenge.deadline = updates.deadline;
    }

    if (updates.skills !== undefined) {
        challenge.skills = updates.skills;
    }

    if (updates.eligibility !== undefined) {
        challenge.eligibility =
            updates.eligibility;
    }

    await challenge.save();

    return challenge;
};