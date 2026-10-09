import { Request, Response } from 'express';

import {
    createTeamInvitation,
    getMyTeamInvitations,
    getMyTeams,
    respondToTeamInvitation,
} from '../services/team-invitation.service';

export const createTeamInvitationController =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const { team, invitedUser } = req.body;
            const invitedBy = req.user!.userId;

            const invitation =
                await createTeamInvitation(
                    team,
                    invitedUser,
                    invitedBy
                );

            return res.status(201).json({
                status: 'success',
                data: { invitation },
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

            if (
                error instanceof Error &&
                error.message === 'TEAM_NOT_ACTIVE'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'Invitations can only be sent for active teams',
                });
            }

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
                error.message === 'CHALLENGE_NOT_OPEN'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'Invitations can only be sent for open challenges',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'USER_NOT_FOUND'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'INVITED_USER_NOT_STUDENT'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'Only students can be invited to teams',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'ONLY_TEAM_LEADER_CAN_INVITE'
            ) {
                return res.status(403).json({
                    status: 'error',
                    message:
                        'Only the team leader can send invitations',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'USER_ALREADY_TEAM_MEMBER'
            ) {
                return res.status(409).json({
                    status: 'error',
                    message:
                        'User is already a member of this team',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'INVITATION_ALREADY_PENDING'
            ) {
                return res.status(409).json({
                    status: 'error',
                    message:
                        'An invitation is already pending for this user',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

export const respondToTeamInvitationController =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const { status } = req.body;
            const invitationId =
                req.params.invitationId;

            const studentId =
                req.user!.userId;

            const invitation =
                await respondToTeamInvitation(
                    invitationId,
                    studentId,
                    status
                );

            return res.status(200).json({
                status: 'success',
                data: { invitation },
            });
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'INVITATION_NOT_FOUND'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Invitation not found',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'NOT_INVITED_STUDENT'
            ) {
                return res.status(403).json({
                    status: 'error',
                    message:
                        'You are not allowed to respond to this invitation',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'INVITATION_ALREADY_RESPONDED'
            ) {
                return res.status(409).json({
                    status: 'error',
                    message:
                        'This invitation has already been responded to',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'TEAM_NOT_FOUND'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Team not found',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'TEAM_NOT_ACTIVE'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'This team is no longer active',
                });
            }

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
                error.message === 'CHALLENGE_NOT_OPEN'
            ) {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'This challenge is no longer open',
                });
            }

            if (
                error instanceof Error &&
                error.message === 'ALREADY_IN_TEAM_FOR_CHALLENGE'
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


    export const getMyTeamInvitationsController =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const studentId =
                req.user!.userId;

            const invitations =
                await getMyTeamInvitations(
                    studentId
                );

            return res.status(200).json({
                status: 'success',
                data: { invitations },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };


    export const getMyTeamsController =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const studentId =
                req.user!.userId;

            const teams =
                await getMyTeams(
                    studentId
                );

            return res.status(200).json({
                status: 'success',
                data: { teams },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
