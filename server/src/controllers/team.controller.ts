import { Request, Response } from 'express';

import { createTeam, getTeamById, getTeamMembers } from '../services/team.service';

export const createTeamController = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            name,
            description,
            challenge,
        } = req.body;

        const studentId =
            req.user!.userId;

        const team = await createTeam(
            name,
            description,
            challenge,
            studentId
        );

        return res.status(201).json({
            status: 'success',
            data: {
                team,
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

        if (
            error instanceof Error &&
            error.message ===
                'CHALLENGE_NOT_OPEN'
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'Teams can only be created for open challenges',
            });
        }

        if (
            error instanceof Error &&
            error.message ===
                'ALREADY_IN_TEAM_FOR_CHALLENGE'
        ) {
            return res.status(409).json({
                status: 'error',
                message:
                    'Student is already in a team for this challenge',
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};

export const getTeamByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const team = await getTeamById(
            req.params.teamId
        );

        return res.status(200).json({
            status: 'success',
            data: {
                team,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'TEAM_NOT_FOUND'
        ) {
            return res.status(404).json({
                status: 'error',
                message: 'Team not found',
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};


export const getTeamMembersController = async (
    req: Request,
    res: Response
) => {
    try {
        const members = await getTeamMembers(
            req.params.teamId
        );

        return res.status(200).json({
            status: 'success',
            data: {
                members,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'TEAM_NOT_FOUND'
        ) {
            return res.status(404).json({
                status: 'error',
                message: 'Team not found',
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};