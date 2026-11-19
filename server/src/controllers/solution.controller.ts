
import { Request, Response } from 'express';
import { logError } from '../utils/log-error';
import {
    createSolution,
    getSolutionById,
    getSolutionsForChallenge,
    reviewSolution,
    updateSolutionImplementationStatus,
    addSolutionMilestone,
    updateSolutionMilestone,
    recordSolutionImpact,
    createSolutionEvidenceUpload,
    attachSolutionEvidence,
    getSolutionEvidence,

} from '../services/solution.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    createUploadUrl,
    createDownloadUrl,
    verifyObjectExists,
    getObjectMetadata,
    validateImageContent,
} from '../services/media.service';

const handleSolutionError = (
    error: unknown,
    res: Response,
    operation: string
): void => {
    const message =
        error instanceof Error ? error.message : '';

    const errors: Record<string, { status: number; message: string }> = {
        INVALID_ID: {
            status: 400,
            message: 'Invalid ID',
        },
        CHALLENGE_NOT_FOUND: {
            status: 404,
            message: 'Challenge not found',
        },
        TEAM_NOT_FOUND: {
            status: 404,
            message: 'Team not found',
        },
        SOLUTION_NOT_FOUND: {
            status: 404,
            message: 'Solution not found',
        },
        TEAM_CHALLENGE_MISMATCH: {
            status: 400,
            message: 'Team does not belong to this challenge',
        },
        NOT_A_TEAM_MEMBER: {
            status: 403,
            message: 'You are not a member of this team',
        },
        TEAM_NOT_ACTIVE: {
            status: 400,
            message: 'Team is not active',
        },
        CHALLENGE_NOT_OPEN: {
            status: 400,
            message: 'Challenge must be open or in progress to accept solutions',
        },
        SOLUTION_NOT_REVIEWABLE: {
            status: 400,
            message: 'Solution cannot be reviewed in its current state',
        },
        SOLUTION_NOT_APPROVED: {
            status: 400,
            message: 'Solution must be approved first',
        },
        SOLUTION_ALREADY_COMPLETED: {
            status: 400,
            message: 'Solution implementation is already completed',
        },
        MILESTONE_NOT_FOUND: {
            status: 404,
            message: 'Milestone not found',
        },
        EVIDENCE_NOT_BELONG_TO_SOLUTION: {
            status: 400,
            message: 'Evidence does not belong to this solution',
        },

        // Solution evidence validation
        UNSUPPORTED_FILE_TYPE: {
            status: 400,
            message: 'Unsupported evidence file type',
        },
        INVALID_FILE_SIZE: {
            status: 400,
            message: 'Evidence file size must be between 1 byte and 10 MB',
        },
        INVALID_EVIDENCE_KEY: {
            status: 400,
            message: 'Invalid evidence storage key',
        },
        EVIDENCE_ALREADY_ATTACHED: {
            status: 409,
            message: 'This evidence has already been attached',
        },
        EVIDENCE_NOT_FOUND: {
            status: 404,
            message: 'Solution evidence not found',
        },
        MEDIA_STORAGE_UNAVAILABLE: {
            status: 503,
            message: 'Media storage is temporarily unavailable. Please try again.',
        },
    };

    const knownError = errors[message];

    if (knownError) {
        res.status(knownError.status).json({
            status: 'error',
            message: knownError.message,
        });
        return;
    }

    logError(`${operation} error:`, error);

    res.status(500).json({
        status: 'error',
        message: `Failed to ${operation}`,
    });
};



export const createSolutionController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const solution = await createSolution(
            req.body,
            req.user!.userId
        );

        res.status(201).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'create solution');
    }
};

export const getSolutionByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const authenticatedReq = req as AuthenticatedRequest;
        const user = authenticatedReq.user;

        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
            });
            return;
        }

        const solution = await getSolutionById(
            req.params.solutionId,
            user.userId,
            user.role === 'ADMIN'
        );

        res.status(200).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'get solution');
    }
};

export const getSolutionsForChallengeController = async (
    req: Request,
    res: Response
) => {
    try {
        const authenticatedReq = req as AuthenticatedRequest;
        const user = authenticatedReq.user;

        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
            });
            return;
        }

        const solutions = await getSolutionsForChallenge(
            req.params.challengeId,
            user.userId,
            user.role === 'ADMIN'
        );

        res.status(200).json({
            status: 'success',
            data: { solutions },
        });
    } catch (error) {
        handleSolutionError(error, res, 'get challenge solutions');
    }
};

export const reviewSolutionController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const solution = await reviewSolution(
            req.params.solutionId,
            req.body.reviewStatus,
            req.user!.userId,
            req.body.reviewNote
        );

        res.status(200).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'review solution');
    }
};

export const updateSolutionImplementationStatusController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const solution = await updateSolutionImplementationStatus(
            req.params.solutionId,
            req.body.implementationStatus,
            req.user!.userId
        );

        res.status(200).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'update implementation status');
    }
};

export const addSolutionMilestoneController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const solution = await addSolutionMilestone(
            req.params.solutionId,
            req.body.title,
            req.user!.userId,
            req.body.description,
            req.body.dueDate
        );

        res.status(201).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'add solution milestone');
    }
};

export const updateSolutionMilestoneController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const solution = await updateSolutionMilestone(
            req.params.solutionId,
            req.params.milestoneId,
            req.body.status,
            req.user!.userId
        );

        res.status(200).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'update solution milestone');
    }
};

export const recordSolutionImpactController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const solution = await recordSolutionImpact(
            req.params.solutionId,
            req.user!.userId,
            req.body
        );

        res.status(201).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'record solution impact');
    }
};





export const createSolutionEvidenceUploadUrlController = async (
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

        const { solutionId } = req.params;
        const { fileName, contentType, size } = req.body;

        const evidence = await createSolutionEvidenceUpload(
            solutionId,
            req.user.userId,
            fileName,
            contentType,
            size
        );

        const uploadUrl = await createUploadUrl(
            evidence.key,
            evidence.contentType,
            evidence.size
        );

        res.status(200).json({
            status: 'success',
            data: {
                uploadUrl,
                ...evidence,
            },
        });
    } catch (error) {
        handleSolutionError(error, res, 'Create solution evidence upload URL');
    }
};

export const attachSolutionEvidenceController = async (
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
        const { solutionId } = req.params;
        const {
            key,
            originalName,
            contentType,
            size,
        } = req.body;

        // Validate the storage key before making any S3 request.
        const expectedPrefix = `solutions/${solutionId}/`;
        const fileName = typeof key === 'string' && key.startsWith(expectedPrefix)
            ? key.slice(expectedPrefix.length)
            : '';

        const isValidEvidenceKey =
            fileName.length > 0 &&
            !fileName.includes('/') &&
            !fileName.includes('\\') &&
            fileName !== '.' &&
            fileName !== '..';

        if (!isValidEvidenceKey) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid evidence storage key',
            });
            return;
        }

        // Authorize access to this solution before probing its storage objects.
        await getSolutionById(solutionId, req.user.userId);

        // Confirm the object exists in S3 before saving its metadata.
        const metadata = await getObjectMetadata(key);



        if (!metadata) {
            res.status(400).json({
                status: 'error',
                message: 'Uploaded evidence file was not found',
            });
            return;
        }

        const allowedContentTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        const maxFileSize = 10 * 1024 * 1024;

        if (!metadata.contentType || !allowedContentTypes.includes(metadata.contentType)) {
            res.status(400).json({
                status: 'error',
                message: 'Unsupported evidence file type',
            });
            return;
        }

        if (
            metadata.size === undefined ||
            metadata.size < 1 ||
            metadata.size > maxFileSize
        ) {
            res.status(400).json({
                status: 'error',
                message: 'Evidence file size must be between 1 byte and 10 MB',
            });
            return;
        }

        if (metadata.contentType !== contentType || metadata.size !== size) {
            res.status(400).json({
                status: 'error',
                message: 'Uploaded file metadata does not match the submitted metadata',
            });
            return;
        }

        const isValidImage = await validateImageContent(
            key,
            metadata.contentType
        );

        if (!isValidImage) {
            res.status(400).json({
                status: 'error',
                message: 'File content does not match a supported image format',
            });
            return;
        }

        const solution = await attachSolutionEvidence(
            solutionId,
            req.user.userId,
            {
                key,
                originalName,
                contentType,
                size,
            }
        );

        res.status(201).json({
            status: 'success',
            data: { solution },
        });
    } catch (error) {
        handleSolutionError(error, res, 'Attach solution evidence');
    }
};

export const createSolutionEvidenceDownloadUrlController = async (
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

        const { solutionId } = req.params;
        const { key } = req.body;

        // This checks that the evidence belongs to the solution
        // and that the requesting user is allowed to access it.
        await getSolutionEvidence(
            solutionId,
            req.user.userId,
            key,
            req.user.role === 'ADMIN'
        );

        const downloadUrl = await createDownloadUrl(key);

        res.status(200).json({
            status: 'success',
            data: { downloadUrl },
        });
    } catch (error) {
        handleSolutionError(error, res, 'Create solution evidence download URL');
    }
};
