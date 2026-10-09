import { Request, Response } from 'express';
import {
    createChallenge,
    getChallenges,
    getChallengeById,
    updateChallengeStatus,
    updateChallenge,
} from '../services/challenge.service';



export const createChallengeController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            title,
            description,
            problem,
            deadline,
            skills,
            eligibility,
        } = req.body;

        const challenge = await createChallenge(
            title,
            description,
            problem,
            deadline,
            skills,
            eligibility,
            req.user!.userId
        );

        res.status(201).json({
            status: 'success',
            data: {
                challenge,
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
            error.message === 'PROBLEM_NOT_VERIFIED'
        ) {
            res.status(400).json({
                status: 'error',
                message:
                    'Challenge can only be created from a verified problem',
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message === 'CHALLENGE_ALREADY_EXISTS'
        ) {
            res.status(409).json({
                status: 'error',
                message:
                    'An active challenge already exists for this problem',
            });
            return;
        }

        console.error(
            'Create challenge error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to create challenge',
        });
    }
};



export const getChallengesController = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const challenges = await getChallenges();

        res.status(200).json({
            status: 'success',
            data: {
                challenges,
            },
        });
    } catch (error) {
        console.error(
            'Get challenges error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to get challenges',
        });
    }
};



export const getChallengeByIdController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { challengeId } = req.params;

        const challenge =
            await getChallengeById(challengeId);

        res.status(200).json({
            status: 'success',
            data: {
                challenge,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'CHALLENGE_NOT_FOUND'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Challenge not found',
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message === 'CHALLENGE_NOT_AVAILABLE'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Challenge not available',
            });
            return;
        }

        console.error(
            'Get challenge error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to get challenge',
        });
    }
};


export const updateChallengeStatusController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { challengeId } = req.params;
        const { status } = req.body;

        const challenge =
            await updateChallengeStatus(
                challengeId,
                status
            );

        res.status(200).json({
            status: 'success',
            data: {
                challenge,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'CHALLENGE_NOT_FOUND'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Challenge not found',
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message ===
                'INVALID_STATUS_TRANSITION'
        ) {
            res.status(400).json({
                status: 'error',
                message:
                    'Invalid challenge status transition',
            });
            return;
        }

        console.error(
            'Update challenge status error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message:
                'Failed to update challenge status',
        });
    }
};



export const updateChallengeController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { challengeId } = req.params;

        const challenge =
            await updateChallenge(
                challengeId,
                req.body
            );

        res.status(200).json({
            status: 'success',
            data: {
                challenge,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'CHALLENGE_NOT_FOUND'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Challenge not found',
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message ===
                'CHALLENGE_NOT_EDITABLE'
        ) {
            res.status(400).json({
                status: 'error',
                message:
                    'Completed or cancelled challenges cannot be edited',
            });
            return;
        }

        console.error(
            'Update challenge error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message:
                'Failed to update challenge',
        });
    }
};