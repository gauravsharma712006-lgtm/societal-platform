import { Problem } from '../models/problem.model';
import { CreateProblemInput } from '../validators/problem.validator';
import mongoose, { Schema, Document } from 'mongoose';
import { Category } from '../models/category.model';
import { PROBLEM_CATEGORIES } from '../constants/problem';




export const createProblem = async (
    data: CreateProblemInput,
    userId: string
) => {
    // =====================================
    // 1. Legacy category compatibility
    // =====================================

    if (!data.categoryId) {
        if (!data.category) {
            throw new Error('PROBLEM_CATEGORY_REQUIRED');
        }

        return Problem.create({
            ...data,
            categoryId: null,
            reportedBy: userId,
            status: 'REPORTED',
        });
    }

    // =====================================
    // 2. Dynamic category validation
    // =====================================

    const selectedCategoryId =
        new mongoose.Types.ObjectId(data.categoryId);

    const visited = new Set<string>();

    let currentId: mongoose.Types.ObjectId | null =
        selectedCategoryId;

    let rootSlug: string | null = null;
    let depth = 0;

    while (currentId !== null) {
        const idString = currentId.toString();

        // Prevent circular hierarchy and
        // categories deeper than three levels.
        if (
            visited.has(idString) ||
            depth >= 3
        ) {
            throw new Error(
                'PROBLEM_CATEGORY_HIERARCHY_INVALID'
            );
        }

        visited.add(idString);


        const currentCategory: {
            slug: string;
            parentId: mongoose.Types.ObjectId | null;
            isActive: boolean;
            isSelectable: boolean;
        } | null = await Category.findById(currentId)
            .select('slug parentId isActive isSelectable')
            .lean();


        // Check whether the category exists.
        if (!currentCategory) {
            throw new Error(
                depth === 0
                    ? 'PROBLEM_CATEGORY_NOT_FOUND'
                    : 'PROBLEM_CATEGORY_HIERARCHY_INVALID'
            );
        }

        // Check whether the selected category
        // and every ancestor are active.
        if (!currentCategory.isActive) {
            throw new Error(
                depth === 0
                    ? 'PROBLEM_CATEGORY_INACTIVE'
                    : 'PROBLEM_CATEGORY_PARENT_INACTIVE'
            );
        }

        // Only the selected category must be
        // selectable. Ancestors can be grouping
        // categories with isSelectable = false.
        if (
            depth === 0 &&
            !currentCategory.isSelectable
        ) {
            throw new Error(
                'PROBLEM_CATEGORY_NOT_SELECTABLE'
            );
        }

        // The last visited category is the root.
        rootSlug = currentCategory.slug;

        // Move up the hierarchy.
        currentId = currentCategory.parentId ?? null;

        depth++;
    }

    // =====================================
    // 3. Legacy category mapping
    // =====================================

    const legacyCategory =
        PROBLEM_CATEGORIES.find(
            (value) => value === rootSlug
        ) ?? null;

    // =====================================
    // 4. Create Problem
    // =====================================

    return Problem.create({
        title: data.title,
        description: data.description,
        location: data.location,
        priority: data.priority,

        category: legacyCategory,
        categoryId: selectedCategoryId,

        reportedBy: userId,
        status: 'REPORTED',
    });
};




export const getProblems = async (
    userId: string,
    role: string
) => {
    const filter = role === 'ADMIN'
        ? {}
        : { reportedBy: userId };

    return Problem.find(filter)
        .sort({ createdAt: -1 })
        .populate('reportedBy', 'name');
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
            'media.key': { $ne: media.key },
        },
        {
            $push: {
                media,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!problem) {
        const existingProblem = await Problem.findOne({
            _id: problemId,
            reportedBy: userId,
            'media.key': media.key,
        });

        if (!existingProblem) {
            throw new Error('PROBLEM_NOT_FOUND');
        }

        return existingProblem;
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



export const requestAdditionalEvidence = async (
    problemId: string,
    adminId: string,
    message: string
) => {
    const problem = await Problem.findById(problemId);

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }

    if (
        problem.status !== 'UNDER_REVIEW' &&
        problem.status !== 'REPORTED'
    ) {
        throw new Error('INVALID_EVIDENCE_REQUEST_STATUS');
    }

    const requestedAt = new Date();

    problem.evidenceRequests.push({
        message,
        requestedBy: new mongoose.Types.ObjectId(adminId),
        status: 'PENDING',
        requestedAt,
        responseMediaKeys: [],
    });
    problem.history.push({
        action: 'EVIDENCE_REQUESTED',
        from: problem.status,
        to: problem.status,
        changedBy: new mongoose.Types.ObjectId(adminId),
        reason: message,
    });

    await problem.save();

    return problem;
};



export const respondToEvidenceRequest = async (
    problemId: string,
    requestId: string,
    userId: string,
    responseMediaKeys: string[]
) => {
    const problem = await Problem.findById(problemId);

    if (!problem) {
        throw new Error('PROBLEM_NOT_FOUND');
    }

    // Only the original reporter can respond.
    if (problem.reportedBy.toString() !== userId) {
        throw new Error('FORBIDDEN');
    }

    const evidenceRequest = problem.evidenceRequests.find(
        (request) => request._id?.toString() === requestId
    );

    if (!evidenceRequest) {
        throw new Error('EVIDENCE_REQUEST_NOT_FOUND');
    }

    if (evidenceRequest.status !== 'PENDING') {
        throw new Error('EVIDENCE_REQUEST_ALREADY_RESPONDED');
    }

    if (!responseMediaKeys.length || responseMediaKeys.length > 10) {
        throw new Error('INVALID_RESPONSE_MEDIA');
    }

    // Every submitted key must belong to this problem and
    // already exist in its attached media records.
    const attachedMediaKeys = new Set(
        problem.media.map((media) => media.key)
    );

    const validKeys = responseMediaKeys.every(
        (key) =>
            key.startsWith(`problems/${problemId}/`) &&
            attachedMediaKeys.has(key)
    );

    if (!validKeys) {
        throw new Error('INVALID_RESPONSE_MEDIA');
    }

    evidenceRequest.status = 'RESPONDED';
    evidenceRequest.respondedAt = new Date();
    evidenceRequest.responseMediaKeys = [...new Set(responseMediaKeys)];

    await problem.save();

    return problem;
};

