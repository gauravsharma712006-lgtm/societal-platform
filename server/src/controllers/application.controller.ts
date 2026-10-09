import { Request, Response } from 'express';
import {
    createApplication,
    getMyApplications,
    getApplicationsForChallenge,
    reviewApplication,
} from '../services/application.service';

export const createApplicationController = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            challenge,
            motivation,
            skills,
        } = req.body;

        const applicantId =
            req.user!.userId;

        const application =
            await createApplication(
                challenge,
                applicantId,
                motivation,
                skills
            );

        return res.status(201).json({
            status: 'success',
            data: {
                application,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'CHALLENGE_NOT_FOUND'
        ) {
            return res.status(404).json({
                status: 'error',
                message: 'Challenge not found',
            });
        }

        if (
            error instanceof Error &&
            error.message ===
                'CHALLENGE_NOT_ACCEPTING_APPLICATIONS'
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'Challenge is not accepting applications',
            });
        }

        if (
            error instanceof Error &&
            error.message ===
                'APPLICATION_ALREADY_EXISTS'
        ) {
            return res.status(409).json({
                status: 'error',
                message:
                    'You have already applied to this challenge',
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};



export const getMyApplicationsController = async (
    req: Request,
    res: Response
) => {
    try {
        const applicantId =
            req.user!.userId;

        const applications =
            await getMyApplications(applicantId);

        return res.status(200).json({
            status: 'success',
            data: {
                applications,
            },
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};


export const getApplicationsForChallengeController =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const { challengeId } = req.params;

            const applications =
                await getApplicationsForChallenge(
                    challengeId
                );

            return res.status(200).json({
                status: 'success',
                data: {
                    applications,
                },
            });
        } catch (error) {
            if (
                error instanceof Error &&
                error.message ===
                    'CHALLENGE_NOT_FOUND'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Challenge not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message:
                    'Internal server error',
            });
        }
    };



    export const reviewApplicationController =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const { applicationId } =
                req.params;

            const {
                status,
                reviewNote,
            } = req.body;

            const adminId =
                req.user!.userId;

            const application =
                await reviewApplication(
                    applicationId,
                    adminId,
                    status,
                    reviewNote
                );

            return res.status(200).json({
                status: 'success',
                data: {
                    application,
                },
            });
        } catch (error) {
            if (
                error instanceof Error &&
                error.message ===
                    'APPLICATION_NOT_FOUND'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message:
                        'Application not found',
                });
            }

            if (
                error instanceof Error &&
                error.message ===
                    'APPLICATION_ALREADY_REVIEWED'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'Application has already been reviewed',
                });
            }

            if (
                error instanceof Error &&
                error.message ===
                    'REVIEW_NOTE_REQUIRED'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'Review note is required when rejecting an application',
                });
            }

            return res.status(500).json({
                status: 'error',
                message:
                    'Internal server error',
            });
        }
    };