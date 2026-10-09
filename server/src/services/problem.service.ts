import { Problem } from '../models/problem.model';
import { CreateProblemInput } from '../validators/problem.validator';
import mongoose, { Schema, Document } from 'mongoose';



export const createProblem = async (
    data: CreateProblemInput,
    userId: string
) => {
    const problem = await Problem.create({
        ...data,
        reportedBy: userId,
        status: 'REPORTED',
    });

    return problem;
};



export const getProblems = async () => {
    const problems = await Problem.find()
        .sort({ createdAt: -1 })
        .populate('reportedBy', 'name email');

    return problems;
};




export const addProblemMedia = async (
    problemId: string,
    userId: string,
    media: {
        key: string;
        originalName: string;
        contentType: string;
        size: number;
    }
) => {
    const problem = await Problem.findOneAndUpdate(
        {
            _id: problemId,
            reportedBy: userId,
        },
        {
            $push: {
                media,
            },
        },
        {
            new: true,
        }
    );

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }

    return problem;
};


export const updateProblemStatus = async (
    problemId: string,
    userId: string,
    status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
) => {
    const problem = await Problem.findById(problemId);

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }

    const currentStatus = problem.status;

    const allowedTransitions: Record<
        string,
        string[]
    > = {
        REPORTED: ['UNDER_REVIEW'],
        UNDER_REVIEW: ['VERIFIED', 'REJECTED'],
        REJECTED: ['UNDER_REVIEW'],
        VERIFIED: [],
    };

    const allowedNextStatuses =
        allowedTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
        throw new Error('INVALID_STATUS_TRANSITION');
    }

    if (status === 'REJECTED' && !rejectionReason) {
        throw new Error('REJECTION_REASON_REQUIRED');
    }

    problem.history.push({
        action: 'STATUS_CHANGED',
        from: currentStatus,
        to: status,
        changedBy: new mongoose.Types.ObjectId(userId),
        reason: rejectionReason,
    });

    problem.status = status;

    await problem.save();

    return problem;
};


export const updateProblemPriority = async (
    problemId: string,
    userId: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
) => {
    const problem = await Problem.findById(problemId);

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }
    const currentPriority = problem.priority;

    problem.history.push({
        action: 'PRIORITY_CHANGED',
        from: currentPriority,
        to: priority,
        changedBy: new mongoose.Types.ObjectId(userId),
    });




    problem.priority = priority;

    await problem.save();

    return problem;
};




export const getProblemHistory = async (
    problemId: string,
    userId: string,
    role: string
) => {
    const problem = await Problem.findById(problemId);

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }

    const isAdmin = role === 'ADMIN';

    const isReporter =
        problem.reportedBy.toString() === userId;

    if (!isAdmin && !isReporter) {
        throw new Error('FORBIDDEN');
    }

    await problem.populate(
        'history.changedBy',
        'name email role'
    );

    return problem.history;
};

