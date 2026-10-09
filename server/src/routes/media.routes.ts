import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createDownloadUrlController, createUploadUrlController } from '../controllers/media.controller';
import { createUploadUrlSchema } from '../validators/media.validator';

const router = Router();

router.post(
    '/upload-url',
    authenticate,
    validate(createUploadUrlSchema),
    createUploadUrlController
);


router.post(
    '/download-url',
    authenticate,
    createDownloadUrlController
);

export default router;