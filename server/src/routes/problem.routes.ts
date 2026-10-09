import { Router } from 'express';

import {
    createProblemController,
    getProblemsController,
    updateProblemPriorityController,
    updateProblemStatusController,
    getProblemHistoryController,
} from '../controllers/problem.controller';


import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProblemSchema } from '../validators/problem.validator';


import { addProblemMediaController } from '../controllers/media.controller';
import { addProblemMediaSchema } from '../validators/problem-media.validator';
import { updateProblemStatusSchema } from '../validators/problem-status.validator';
import { authorize } from '../middleware/authorize.middleware';
import { updateProblemPrioritySchema } from '../validators/problem-priority.validator';

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
    validate(addProblemMediaSchema),
    addProblemMediaController
);

router.patch(
    '/:problemId/status',
    authenticate,
    authorize('ADMIN'),
    validate(updateProblemStatusSchema),
    updateProblemStatusController
);



router.patch(
    '/:problemId/priority',
    authenticate,
    authorize('ADMIN'),
    validate(updateProblemPrioritySchema),
    updateProblemPriorityController
);

router.get(
    '/:problemId/history',
    authenticate,
    getProblemHistoryController
);

export default router;