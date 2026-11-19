
import { z } from 'zod';
import { mongoObjectIdSchema } from './common.validator';

export const createTeamInvitationSchema = z.object({
    team: mongoObjectIdSchema,
    invitedUser: mongoObjectIdSchema,
});

export const respondToTeamInvitationSchema = z.object({
    invitationId: mongoObjectIdSchema,
    status: z.enum([
        'ACCEPTED',
        'REJECTED',
    ]),
});
