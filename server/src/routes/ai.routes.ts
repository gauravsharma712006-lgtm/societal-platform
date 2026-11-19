
import { Router } from 'express';

import { improveProblemController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { improveProblemSchema } from '../validators/ai.validator';

const router = Router();

router.post(
  '/improve-problem',
  authenticate,
  validate(improveProblemSchema),
  improveProblemController,
);

export default router;
