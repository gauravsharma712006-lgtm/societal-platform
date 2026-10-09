import { z } from 'zod';

export const createTeamInvitationSchema =
    z.object({
        team: z.string().min(1),
        invitedUser: z.string().min(1),
    });

export const respondToTeamInvitationSchema =
    z.object({
        status: z.enum([
            'ACCEPTED',
            'REJECTED',
        ]),
    });