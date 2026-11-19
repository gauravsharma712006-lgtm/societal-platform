import { Router } from 'express';

import {
    createProblemController,
    getProblemsController,
    updateProblemPriorityController,
    updateProblemStatusController,
    getProblemHistoryController,
    requestAdditionalEvidenceController,
    respondToEvidenceRequestController,
} from '../controllers/problem.controller';

import { problemIdSchema } from '../validators/problem.validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProblemSchema } from '../validators/problem.validator';


import { addProblemMediaController } from '../controllers/media.controller';
import { addProblemMediaSchema } from '../validators/problem-media.validator';
import { updateProblemStatusSchema } from '../validators/problem-status.validator';
import { authorize } from '../middleware/authorize.middleware';
import { updateProblemPrioritySchema } from '../validators/problem-priority.validator';
import { createEvidenceRequestSchema, respondToEvidenceRequestSchema } from '../validators/evidence-request.validator';

const router = Router();

router.post(
    '/',
    authenticate,
    validate(createProblemSchema),
    createProblemController
);

router.get(
    '/',
    authenticate,
    getProblemsController
);


router.post(
    '/:problemId/media',
    authenticate,
    validate(problemIdSchema),
    validate(addProblemMediaSchema),
    addProblemMediaController
);

router.patch(
    '/:problemId/status',
    authenticate,
    validate(problemIdSchema),
    authorize('ADMIN'),
    validate(updateProblemStatusSchema),
    updateProblemStatusController
);



router.patch(
    '/:problemId/priority',
    authenticate,
    validate(problemIdSchema),
    authorize('ADMIN'),
    validate(updateProblemPrioritySchema),
    updateProblemPriorityController
);

router.get(
    '/:problemId/history',
    authenticate,
    validate(problemIdSchema),
    getProblemHistoryController
);

router.post(
    '/evidence-requests',
    authenticate,
    authorize('ADMIN'),
    validate(createEvidenceRequestSchema),
    requestAdditionalEvidenceController
);


router.post(
    '/evidence-requests/respond',
    authenticate,
    validate(respondToEvidenceRequestSchema),
    respondToEvidenceRequestController
);


export default router;