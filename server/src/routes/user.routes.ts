import { Router } from 'express';

import {
  authenticate,
} from '../middleware/auth.middleware';

import {
  validate,
} from '../middleware/validate.middleware';

import {
  getMe,
  getStudentsController,
  updateProfile,
} from '../controllers/user.controller';

import {
  updateProfileSchema,
} from '../validators/user.validator';

const router = Router();



router.get(
  '/students',
  authenticate,
  getStudentsController
);




router.get(
  '/me',
  authenticate,
  getMe
);



router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  updateProfile
);



export default router;

