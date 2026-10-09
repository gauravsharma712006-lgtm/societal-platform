import { Router } from 'express';
import {
    createChallengeController,
    getChallengesController,
    getChallengeByIdController,
    updateChallengeStatusController,
    updateChallengeController,
    
} from '../controllers/challenge.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createChallengeSchema,
    updateChallengeStatusSchema,
    updateChallengeSchema,
} from '../validators/challenge.validator';


const router = Router();

router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    validate(createChallengeSchema),
    createChallengeController
);


router.get(
    '/',
    authenticate,
    getChallengesController
);


router.get(
    '/:challengeId',
    authenticate,
    getChallengeByIdController
);

router.patch(
    '/:challengeId/status',
    authenticate,
    authorize('ADMIN'),
    validate(updateChallengeStatusSchema),
    updateChallengeStatusController
);


router.patch(
    '/:challengeId',
    authenticate,
    authorize('ADMIN'),
    validate(updateChallengeSchema),
    updateChallengeController
);



export default router;