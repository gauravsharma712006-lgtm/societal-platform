import { Response } from 'express';
import crypto from 'crypto';
import { logError } from '../utils/log-error';

import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    createDownloadUrl,
    createUploadUrl,
    getObjectMetadata,
    validateImageContent,
} from '../services/media.service';
import { Problem } from '../models/problem.model';
import { addProblemMedia } from '../services/problem.service';







export const addProblemMediaController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
            });

            return;
        }

        const { problemId } = req.params;

        const {
            key,
            originalName,
            contentType,
            size,
        } = req.body;


        const expectedPrefix = `problems/${problemId}/`;

        const storageName = typeof key === 'string' && key.startsWith(expectedPrefix)
            ? key.slice(expectedPrefix.length) : '';
        if (!storageName || storageName.includes('/') || storageName.includes('\\') ||
            storageName === '.' || storageName === '..') {
            res.status(400).json({
                status: 'error',
                message: 'Invalid media key',
            });
            return;
        }

        const ownedProblem = await Problem.findOne({
            _id: problemId,
            reportedBy: req.user.userId,
        });

        if (!ownedProblem) {
            res.status(404).json({
                status: 'error',
                message: 'Problem not found',
            });
            return;
        }

        const metadata = await getObjectMetadata(key);

        if (!metadata) {
            res.status(400).json({
                status: 'error',
                message: 'Uploaded media was not found in storage',
            });
            return;
        }

        if (
            metadata.contentType !== contentType ||
            metadata.size !== size
        ) {
            res.status(400).json({
                status: 'error',
                message: 'Uploaded file metadata does not match the submitted metadata',
            });
            return;
        }

        const isValidImage = await validateImageContent(
            key,
            contentType
        );

        if (!isValidImage) {
            res.status(400).json({
                status: 'error',
                message: 'File content does not match a supported image format',
            });
            return;
        }

        const problem = await addProblemMedia(
            problemId,
            req.user.userId,
            {
                key,
                originalName,
                contentType,
                size,
            }
        );

        res.status(200).json({
            status: 'success',
            data: problem,
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'MEDIA_STORAGE_UNAVAILABLE') {
            res.status(503).json({
                status: 'error',
                message: 'Media storage is temporarily unavailable. Please try again.',
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message === 'PROBLEM_NOT_FOUND'
        ) {
            res.status(404).json({
                status: 'error',
                message: 'Problem not found',
            });

            return;
        }

        logError(
            'Add problem media error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to save media',
        });
    }
};



export const createDownloadUrlController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
            });
            return;
        }

        const { problemId, key } = req.body;

        const problem = await Problem.findById(problemId);



if (!problem) {
  res.status(404).json({
    status: 'error',
    message: 'Problem not found',
  });
  return;
}

const isOwner =
  problem.reportedBy.toString() === req.user!.userId;

const isAdmin = req.user!.role === 'ADMIN';

if (!isOwner && !isAdmin) {
   res.status(404).json({
    status: 'error',
    message: 'Problem or media not found',
  });
  return
}

const media = problem.media.find(
  (item) => item.key === key
);

if (!media) {
   res.status(404).json({
    status: 'error',
    message: 'Problem or media not found',
  });
  return
}

        const downloadUrl = await createDownloadUrl(key);

        res.status(200).json({
            status: 'success',
            data: {
                downloadUrl,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'MEDIA_STORAGE_UNAVAILABLE') {
            res.status(503).json({ status: 'error', message: 'Media storage is temporarily unavailable. Please try again.' });
            return;
        }
        logError('Create download URL error:', error);

        res.status(500).json({
            status: 'error',
            message: 'Failed to create download URL',
        });
    }
};


export const createUploadUrlController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
            });

            return;
        }






        const {
            problemId,
            fileName,
            contentType,
            size,
        } = req.body;



        const problem = await Problem.findOne({
            _id: problemId,
            reportedBy: req.user.userId,
        });

        if (!problem) {
            res.status(404).json({
                status: 'error',
                message: 'Problem not found',
            });

            return;
        }




        const mediaId = crypto.randomUUID();

        const extensionMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };

        const extension = extensionMap[contentType];

        const key = `problems/${problemId}/${mediaId}.${extension}`;


        const uploadUrl = await createUploadUrl(
            key,
            contentType,
            size
        );

        res.status(200).json({
            status: 'success',
            data: {
                uploadUrl,
                key,
                fileName,
                contentType,
                size,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'MEDIA_STORAGE_UNAVAILABLE') {
            res.status(503).json({ status: 'error', message: 'Media storage is temporarily unavailable. Please try again.' });
            return;
        }
        logError(
            'Create upload URL error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to create upload URL',
        });
    }
};
