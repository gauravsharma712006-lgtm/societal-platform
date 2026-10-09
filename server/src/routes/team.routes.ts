import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';

import { createTeamSchema, teamIdSchema } from '../validators/team.validator';

import {
    createTeamController,
    getTeamByIdController,
    getTeamMembersController,
} from '../controllers/team.controller';
import { getMyTeamsController } from '../controllers/team-invitation.controller';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize('STUDENT'),
    validate(createTeamSchema),
    createTeamController
);


router.get(
    '/my',
    authenticate,
    getMyTeamsController
);

router.get(
    '/:teamId',
    authenticate,
    validate(teamIdSchema),
    getTeamByIdController
);

router.get(
    '/:teamId/members',
    authenticate,
    validate(teamIdSchema),
    getTeamMembersController
);


export default router;