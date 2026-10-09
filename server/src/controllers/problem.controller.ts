import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    createProblem,
    getProblemHistory,
    getProblems,
    updateProblemPriority,

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
    _req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const problems = await getProblems();

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