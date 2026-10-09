import { Response } from 'express';
import crypto from 'crypto';

import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createDownloadUrl, createUploadUrl, verifyObjectExists } from '../services/media.service';
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

        if (!key.startsWith(expectedPrefix)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid media key',
            });
            return;
        }

        const objectExists = await verifyObjectExists(key);

        if (!objectExists) {
            res.status(400).json({
                status: 'error',
                message: 'Uploaded media was not found in storage',
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

        console.error(
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

        const mediaExists = problem.media.some(
            (media) => media.key === key
        );

        if (!mediaExists) {
            res.status(404).json({
                status: 'error',
                message: 'Media not found',
            });
            return;
        }

        const downloadUrl = await createDownloadUrl(key);

        res.status(200).json({
            status: 'success',
            data: {
                downloadUrl,
            },
        });
    } catch (error) {
        console.error('Create download URL error:', error);

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
            contentType
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
        console.error(
            'Create upload URL error:',
            error
        );

        res.status(500).json({
            status: 'error',
            message: 'Failed to create upload URL',
        });
    }
};