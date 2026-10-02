import { Router } from 'express';
import {
  login,
  register,
  getMe,
} from '../controllers/auth.controller';

import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  loginSchema,
  registerSchema,
} from '../validators/auth.validator';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  register
);

router.post(
  '/login',
  validate(loginSchema),
  login
);

router.get(
  '/me',
  authenticate,
  getMe
);

export default router;