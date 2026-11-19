import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    createProblem,
    getProblemHistory,
    getProblems,
    requestAdditionalEvidence,
    updateProblemPriority,
    respondToEvidenceRequest,

} from '../services/problem.service';

import {
    updateProblemStatus,
} from '../services/problem.service';


export const createProblemController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
            });

            return;
        }

        const problem = await createProblem(
            req.body,
            req.user.userId
        );

        res.status(201).json({
            status: 'success',
            message: 'Problem reported successfully',
            data: problem,
        });
    } catch (error) {
        if (error instanceof Error) {
            const categoryErrors: Record<
                string,
                { status: number; message: string }
            > = {
                PROBLEM_CATEGORY_REQUIRED: {
                    status: 400,
                    message: 'A problem category is required',
                },
                PROBLEM_CATEGORY_NOT_FOUND: {
                    status: 404,
                    message: 'Problem category not found',
                },
                PROBLEM_CATEGORY_INACTIVE: {
                    status: 400,
                    message: 'The selected problem category is inactive',
                },
                PROBLEM_CATEGORY_NOT_SELECTABLE: {
                    status: 400,
                    message: 'The selected problem category cannot be used for reports',
                },
                PROBLEM_CATEGORY_PARENT_INACTIVE: {
                    status: 400,
                    message: 'The selected problem category has an inactive parent',
                },
                PROBLEM_CATEGORY_HIERARCHY_INVALID: {
                    status: 400,
                    message: 'The selected problem category hierarchy is invalid',
                },
            };

            const categoryError = categoryErrors[error.message];

            if (categoryError) {
                res.status(categoryError.status).json({
                    status: 'error',
                    message: categoryError.message,
                });
                return;
            }
        }

        console.error(
            'Create problem error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to report problem',
        });
    }
};

export const getProblemsController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const problems = await getProblems(
            req.user!.userId,
            req.user!.role
        );

        res.status(200).json({
            status: 'success',
            data: problems,
        });
    } catch (error) {
        console.error(
            'Get problems error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch problems',
        });
    }
};


export const updateProblemStatusController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { problemId } = req.params;
        const { status, rejectionReason } = req.body;

        const problem = await updateProblemStatus(
            problemId,
            req.user!.userId,
            status,
            rejectionReason
        );

        res.status(200).json({
            status: 'success',
            data: {
                problem,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'PROBLEM_NOT_FOUND') {
                res.status(404).json({
                    status: 'error',
                    message: 'Problem not found',
                });
                return;
            }

            if (
                error.message ===
                'INVALID_STATUS_TRANSITION'
            ) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid problem status transition',
                });
                return;
            }

            if (
                error.message ===
                'REJECTION_REASON_REQUIRED'
            ) {
                res.status(400).json({
                    status: 'error',
                    message: 'Rejection reason is required',
                });
                return;
            }
        }

        console.error(
            'Update problem status error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to update problem status',
        });
    }
};


export const updateProblemPriorityController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { problemId } = req.params;
        const { priority } = req.body;

        const problem = await updateProblemPriority(
            problemId,
            req.user!.userId,
            priority
        );

        res.status(200).json({
            status: 'success',
            data: {
                problem,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'PROBLEM_NOT_FOUND'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Problem not found',
            });
            return;
        }

        console.error(
            'Update problem priority error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to update problem priority',
        });
    }
};

export const getProblemHistoryController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { problemId } = req.params;

        const history = await getProblemHistory(problemId,
            req.user!.userId
            , req.user!.role);

        res.status(200).json({
            status: 'success',
            data: {
                history,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'PROBLEM_NOT_FOUND'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Problem not found',
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message === 'FORBIDDEN'
        ) {
            res.status(403).json({
                status: 'error',
                message:
                    'You are not authorized to view this problem history',
            });
            return;
        }

        console.error(
            'Get problem history error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to get problem history',
        });
    }
};

export const requestAdditionalEvidenceController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const { problemId, message } = req.body;

        const problem = await requestAdditionalEvidence(
            problemId,
            req.user!.userId,
            message
        );

        res.status(201).json({
            status: 'success',
            message: 'Additional evidence requested successfully',
            data: problem,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'PROBLEM_NOT_FOUND') {
                res.status(404).json({
                    status: 'error',
                    message: 'Problem not found',
                });
                return;
            }

            if (error.message === 'INVALID_EVIDENCE_REQUEST_STATUS') {
                res.status(400).json({
                    status: 'error',
                    message: 'Evidence cannot be requested for this problem status',
                });
                return;
            }
        }

        console.error('Request additional evidence error:', error);

        res.status(500).json({
            status: 'error',
            message: 'Failed to request additional evidence',
        });
    }
};


export const respondToEvidenceRequestController = async (
    req: Request,
    res: Response
) => {
    try {
        const { problemId, requestId, responseMediaKeys } = req.body;

        const problem = await respondToEvidenceRequest(
            problemId,
            requestId,
            req.user!.userId,
            responseMediaKeys
        );

        return res.status(200).json({
            success: true,
            message: 'Additional evidence submitted successfully.',
            data: problem,
        });
    } catch (error) {
        const code = error instanceof Error ? error.message : '';

        const errorResponses: Record<string, { status: number; message: string }> = {
            PROBLEM_NOT_FOUND: {
                status: 404,
                message: 'Problem not found.',
            },
            EVIDENCE_REQUEST_NOT_FOUND: {
                status: 404,
                message: 'Evidence request not found.',
            },
            FORBIDDEN: {
                status: 403,
                message: 'You are not authorized to respond to this problem.',
            },
            EVIDENCE_REQUEST_ALREADY_RESPONDED: {
                status: 400,
                message: 'This evidence request has already been answered.',
            },
            INVALID_RESPONSE_MEDIA: {
                status: 400,
                message: 'The submitted evidence files are invalid.',
            },
        };

        const knownError = errorResponses[code];

        if (knownError) {
            return res.status(knownError.status).json({
                success: false,
                message: knownError.message,
            });
        }

        console.error('Respond to evidence request error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to submit additional evidence.',
        });
    }
};
