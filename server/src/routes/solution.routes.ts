
import { Router } from 'express';

import {
    createSolutionController,
    getSolutionByIdController,
    getSolutionsForChallengeController,
    reviewSolutionController,
    updateSolutionImplementationStatusController,
    addSolutionMilestoneController,
    updateSolutionMilestoneController,
    recordSolutionImpactController,
    createSolutionEvidenceUploadUrlController,
    attachSolutionEvidenceController,
    createSolutionEvidenceDownloadUrlController,
} from '../controllers/solution.controller';

import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';

import { challengeIdParamSchema } from '../validators/challenge.validator';

import {
    createSolutionSchema,
    solutionIdSchema,
    reviewSolutionSchema,
    updateImplementationStatusSchema,
    createMilestoneSchema,
    updateMilestoneSchema,
    recordImpactSchema,
    createSolutionEvidenceUploadSchema,
    attachSolutionEvidenceSchema,
    downloadSolutionEvidenceSchema
} from '../validators/solution.validator';

const router = Router();

// Submit a solution. The service verifies team membership.
router.post(
    '/',
    authenticate,
    validate(createSolutionSchema),
    createSolutionController
);

// List solutions for a challenge.
// Keep this route before /:solutionId.
router.get(
    '/challenge/:challengeId',
    authenticate,
    validate(challengeIdParamSchema),
    getSolutionsForChallengeController
);

// Review a solution: administrators only.
router.patch(
    '/:solutionId/review',
    authenticate,
    authorize('ADMIN'),
    validate(reviewSolutionSchema),
    reviewSolutionController
);

// Update implementation status: team membership is checked by the service.
router.patch(
    '/:solutionId/implementation',
    authenticate,
    validate(updateImplementationStatusSchema),
    updateSolutionImplementationStatusController
);

// Add an implementation milestone.
router.post(
    '/:solutionId/milestones',
    authenticate,
    validate(createMilestoneSchema),
    addSolutionMilestoneController
);

// Update an existing milestone.
router.patch(
    '/:solutionId/milestones/:milestoneId',
    authenticate,
    validate(updateMilestoneSchema),
    updateSolutionMilestoneController
);

// Record an impact indicator.
router.post(
    '/:solutionId/impact',
    authenticate,
    validate(recordImpactSchema),
    recordSolutionImpactController
);

router.post(
    '/:solutionId/evidence/upload-url',
    authenticate,
    validate(createSolutionEvidenceUploadSchema),
    createSolutionEvidenceUploadUrlController
);

router.post(
    '/:solutionId/evidence',
    authenticate,
    validate(attachSolutionEvidenceSchema),
    attachSolutionEvidenceController
);

router.post(
    '/:solutionId/evidence/download-url',
    authenticate,
    validate(downloadSolutionEvidenceSchema),
    createSolutionEvidenceDownloadUrlController
);

// Get a solution by ID. Keep this after the specific routes.
router.get(
    '/:solutionId',
    authenticate,
    validate(solutionIdSchema),
    getSolutionByIdController
);

export default router;

