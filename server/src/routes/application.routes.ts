import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';

import {
    createApplicationSchema,
    reviewApplicationSchema,
} from '../validators/application.validator';
import {
    createApplicationController,
    getMyApplicationsController,
    getApplicationsForChallengeController,
    reviewApplicationController,
} from '../controllers/application.controller';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize('STUDENT'),
    validate(createApplicationSchema),
    createApplicationController
);

router.get(
    '/',
    authenticate,
    authorize('STUDENT'),
    getMyApplicationsController
);


router.get(
    '/challenge/:challengeId',
    authenticate,
    authorize('ADMIN'),
    getApplicationsForChallengeController
);

router.patch(
    '/:applicationId/review',
    authenticate,
    authorize('ADMIN'),
    validate(reviewApplicationSchema),
    reviewApplicationController
);

export default router;