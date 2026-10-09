import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import {
    createTeamInvitationSchema,
    respondToTeamInvitationSchema,
} from '../validators/team-invitation.validator';

import {
    createTeamInvitationController,
    getMyTeamInvitationsController,
    respondToTeamInvitationController,
} from '../controllers/team-invitation.controller';

const router = Router();

router.post(
    '/',
    authenticate,
    validate(createTeamInvitationSchema),
    createTeamInvitationController
);

router.patch(
    '/:invitationId',
    authenticate,
    validate(respondToTeamInvitationSchema),
    respondToTeamInvitationController
);


router.get(
    '/my',
    authenticate,
    getMyTeamInvitationsController
);

export default router;