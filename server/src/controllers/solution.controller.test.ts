
import { Request, Response } from 'express';
import {
    attachSolutionEvidence,
    createSolutionEvidenceUpload,
    getSolutionEvidence,
    getSolutionById,
} from '../services/solution.service';
import {
    getObjectMetadata,
    createUploadUrl,
    createDownloadUrl,
    validateImageContent,

} from '../services/media.service';
import {
    createSolutionController,
    getSolutionByIdController,
    getSolutionsForChallengeController,
    reviewSolutionController,
    updateSolutionImplementationStatusController,
    addSolutionMilestoneController,
    updateSolutionMilestoneController,
    recordSolutionImpactController,
    attachSolutionEvidenceController,
    createSolutionEvidenceUploadUrlController,
    createSolutionEvidenceDownloadUrlController,
} from './solution.controller';

jest.mock('../services/solution.service', () => ({
    createSolution: jest.fn(),
    getSolutionById: jest.fn(),
    getSolutionsForChallenge: jest.fn(),
    reviewSolution: jest.fn(),
    updateSolutionImplementationStatus: jest.fn(),
    addSolutionMilestone: jest.fn(),
    updateSolutionMilestone: jest.fn(),
    recordSolutionImpact: jest.fn(),
    createSolutionEvidenceUpload: jest.fn(),
    attachSolutionEvidence: jest.fn(),
    getSolutionEvidence: jest.fn(),
}));

jest.mock('../services/media.service', () => ({
    createUploadUrl: jest.fn(),
    createDownloadUrl: jest.fn(),
    verifyObjectExists: jest.fn(),
    getObjectMetadata: jest.fn(),
    validateImageContent: jest.fn(),
}));

const mockedAttachSolutionEvidence = jest.mocked(attachSolutionEvidence);
const mockedGetObjectMetadata = jest.mocked(getObjectMetadata);

describe('Solution controller — evidence attachment security', () => {
    const solutionId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';

    const evidence = {
        key: `solutions/${solutionId}/evidence.jpg`,
        originalName: 'evidence.jpg',
        contentType: 'image/jpeg',
        size: 1024,
    };

    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: { solutionId },
            body: {
                solutionId,
                fileName: 'evidence.jpg',
                ...evidence,
            },
            user: { userId, role: 'USER' },
        } as unknown as Partial<Request>;

        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();

        res = {
            status: statusMock,
            json: jsonMock,
        };
    });

    it('rejects when the S3 object does not exist', async () => {
        mockedGetObjectMetadata.mockResolvedValue(null);

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects unauthorized solution access before probing S3', async () => {
        jest.mocked(getSolutionById).mockRejectedValueOnce(new Error('NOT_A_TEAM_MEMBER'));

        await attachSolutionEvidenceController(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(mockedGetObjectMetadata).not.toHaveBeenCalled();
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('reports storage outages as retryable failures without attaching evidence', async () => {
        mockedGetObjectMetadata.mockRejectedValueOnce(new Error('MEDIA_STORAGE_UNAVAILABLE'));

        await attachSolutionEvidenceController(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(503);
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects an evidence key belonging to another solution before S3 lookup', async () => {
        req.body.key = 'solutions/507f1f77bcf86cd799439012/evidence.jpg';

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Invalid evidence storage key',
            })
        );
        expect(mockedGetObjectMetadata).not.toHaveBeenCalled();
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects a nested evidence key before S3 lookup', async () => {
        req.body.key = `solutions/${solutionId}/nested/evidence.jpg`;

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockedGetObjectMetadata).not.toHaveBeenCalled();
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects an empty evidence filename before S3 lookup', async () => {
        req.body.key = `solutions/${solutionId}/`;

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockedGetObjectMetadata).not.toHaveBeenCalled();
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects unsupported actual S3 content types', async () => {
        mockedGetObjectMetadata.mockResolvedValue({
            contentType: 'application/pdf',
            size: 1024,
        });

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Unsupported evidence file type',
            })
        );
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects files larger than 10 MB', async () => {
        mockedGetObjectMetadata.mockResolvedValue({
            contentType: 'image/jpeg',
            size: 10 * 1024 * 1024 + 1,
        });

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('rejects client metadata that does not match S3 metadata', async () => {
        mockedGetObjectMetadata.mockResolvedValue({
            contentType: 'image/jpeg',
            size: 2048,
        });

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Uploaded file metadata does not match the submitted metadata',
            })
        );
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('attaches evidence when S3 metadata matches', async () => {
        mockedGetObjectMetadata.mockResolvedValue({
            contentType: 'image/jpeg',
            size: 1024,
        });

        mockedAttachSolutionEvidence.mockResolvedValue({
            ...evidence,
        } as never);

        (jest.mocked(validateImageContent)).mockResolvedValue(true);

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(mockedAttachSolutionEvidence).toHaveBeenCalledWith(
            solutionId,
            userId,
            evidence
        );
        expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('rejects evidence keys that do not belong to the URL solution', async () => {
        req.params = { solutionId: '507f1f77bcf86cd799439012' };
        mockedGetObjectMetadata.mockResolvedValue({
            contentType: 'image/jpeg',
            size: 1024,
        });

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockedGetObjectMetadata).not.toHaveBeenCalled();
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });

    it('generates an upload URL for valid evidence', async () => {
        jest.mocked(createSolutionEvidenceUpload).mockResolvedValue({
            key: `solutions/${solutionId}/evidence.jpg`,
            originalName: 'evidence.jpg',
            contentType: 'image/jpeg',
            size: 1024,
        } as never);

        jest.mocked(createUploadUrl).mockResolvedValue(
            'https://example.com/upload'
        );

        await createSolutionEvidenceUploadUrlController(
            req as never,
            res as Response
        );

        expect(createSolutionEvidenceUpload).toHaveBeenCalledWith(
            solutionId,
            userId,
            'evidence.jpg',
            'image/jpeg',
            1024
        );
        expect(createUploadUrl).toHaveBeenCalledWith(evidence.key, evidence.contentType, evidence.size);
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('does not generate an upload URL when service validation fails', async () => {
        jest.mocked(createSolutionEvidenceUpload).mockRejectedValue(
            new Error('NOT_A_TEAM_MEMBER')
        );

        await createSolutionEvidenceUploadUrlController(
            req as never,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(createUploadUrl).not.toHaveBeenCalled();
    });

    it('generates a download URL after evidence access is authorized', async () => {
        jest.mocked(getSolutionEvidence).mockResolvedValue({
            key: evidence.key,
            originalName: evidence.originalName,
            contentType: evidence.contentType,
            size: evidence.size,
        } as never);

        jest.mocked(createDownloadUrl).mockResolvedValue(
            'https://example.com/download'
        );

        await createSolutionEvidenceDownloadUrlController(
            req as never,
            res as Response
        );

        expect(getSolutionEvidence).toHaveBeenCalledWith(
            solutionId,
            userId,
            evidence.key,
            false
        );
        expect(createDownloadUrl).toHaveBeenCalledWith(evidence.key);
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('does not generate a download URL when evidence access is denied', async () => {
        jest.mocked(getSolutionEvidence).mockRejectedValue(
            new Error('EVIDENCE_NOT_FOUND')
        );

        await createSolutionEvidenceDownloadUrlController(
            req as never,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(createDownloadUrl).not.toHaveBeenCalled();
    });

    it('allows admins to request evidence download URLs', async () => {
        (req as any).user.role = 'ADMIN';

        (getSolutionEvidence as jest.Mock).mockResolvedValue(evidence);
        (createDownloadUrl as jest.Mock).mockResolvedValue(
            'https://example.com/download'
        );

        await createSolutionEvidenceDownloadUrlController(
            req as Request,
            res as Response
        );

        expect(getSolutionEvidence).toHaveBeenCalledWith(
            solutionId,
            userId,
            evidence.key,
            true
        );

        expect(createDownloadUrl).toHaveBeenCalledWith(evidence.key);
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('rejects evidence when image content is invalid', async () => {
        (getObjectMetadata as jest.Mock).mockResolvedValue({
            contentType: 'image/jpeg',
            size: 1024,
        });

        (validateImageContent as jest.Mock).mockResolvedValue(false);

        await attachSolutionEvidenceController(
            req as Request,
            res as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockedAttachSolutionEvidence).not.toHaveBeenCalled();
    });


});

describe('Solution controller — core workflows', () => {
    const solutionId = '507f1f77bcf86cd799439011';
    const challengeId = '507f191e810c19729de860ea';
    const milestoneId = '507f1f77bcf86cd799439012';
    const userId = '507f191e810c19729de860eb';

    const solution = { _id: solutionId, title: 'Test solution' };

    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: { solutionId, challengeId, milestoneId },
            body: {
                title: 'Test milestone',
                description: 'Milestone description',
                dueDate: '2026-12-01',
                reviewStatus: 'APPROVED',
                reviewNote: 'Looks good',
                implementationStatus: 'IN_PROGRESS',
                status: 'COMPLETED',
            },
            user: { userId, role: 'USER' },
        } as unknown as Partial<Request>;

        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();
        res = { status: statusMock, json: jsonMock };
    });

    it('creates a solution and returns 201', async () => {
        (jest.mocked(
            require('../services/solution.service').createSolution
        )).mockResolvedValue(solution as never);

        await createSolutionController(req as Request, res as Response);

        expect(
            require('../services/solution.service').createSolution
        ).toHaveBeenCalledWith(req.body, userId);
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
            status: 'success',
            data: { solution },
        });
    });

    it('returns a solution by ID for an authenticated user', async () => {
        (jest.mocked(
            require('../services/solution.service').getSolutionById
        )).mockResolvedValue(solution as never);

        await getSolutionByIdController(req as Request, res as Response);

        expect(
            require('../services/solution.service').getSolutionById
        ).toHaveBeenCalledWith(solutionId, userId, false);
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('returns 401 when fetching a solution without authentication', async () => {
        delete (req as any).user;

        await getSolutionByIdController(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(
            require('../services/solution.service').getSolutionById
        ).not.toHaveBeenCalled();
    });

    it('lists solutions for a challenge', async () => {
        const solutions = [solution];

        (jest.mocked(
            require('../services/solution.service').getSolutionsForChallenge
        )).mockResolvedValue(solutions as never);

        await getSolutionsForChallengeController(
            req as Request,
            res as Response
        );

        expect(
            require('../services/solution.service').getSolutionsForChallenge
        ).toHaveBeenCalledWith(challengeId, userId, false);
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('passes review details to the review service', async () => {
        (jest.mocked(
            require('../services/solution.service').reviewSolution
        )).mockResolvedValue(solution as never);

        await reviewSolutionController(req as Request, res as Response);

        expect(
            require('../services/solution.service').reviewSolution
        ).toHaveBeenCalledWith(
            solutionId,
            'APPROVED',
            userId,
            'Looks good'
        );
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('updates implementation status', async () => {
        (jest.mocked(
            require('../services/solution.service')
                .updateSolutionImplementationStatus
        )).mockResolvedValue(solution as never);

        await updateSolutionImplementationStatusController(
            req as Request,
            res as Response
        );

        expect(
            require('../services/solution.service')
                .updateSolutionImplementationStatus
        ).toHaveBeenCalledWith(solutionId, 'IN_PROGRESS', userId);
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('adds a milestone', async () => {
        (jest.mocked(
            require('../services/solution.service').addSolutionMilestone
        )).mockResolvedValue(solution as never);

        await addSolutionMilestoneController(req as Request, res as Response);

        expect(
            require('../services/solution.service').addSolutionMilestone
        ).toHaveBeenCalledWith(
            solutionId,
            'Test milestone',
            userId,
            'Milestone description',
            '2026-12-01'
        );
        expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('updates a milestone', async () => {
        (jest.mocked(
            require('../services/solution.service').updateSolutionMilestone
        )).mockResolvedValue(solution as never);

        await updateSolutionMilestoneController(
            req as Request,
            res as Response
        );

        expect(
            require('../services/solution.service').updateSolutionMilestone
        ).toHaveBeenCalledWith(
            solutionId,
            milestoneId,
            'COMPLETED',
            userId
        );
        expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('records solution impact', async () => {
        const impact = { peopleHelped: 25, description: 'Community benefit' };
        req.body = impact;

        (jest.mocked(
            require('../services/solution.service').recordSolutionImpact
        )).mockResolvedValue(solution as never);

        await recordSolutionImpactController(req as Request, res as Response);

        expect(
            require('../services/solution.service').recordSolutionImpact
        ).toHaveBeenCalledWith(solutionId, userId, impact);
        expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('maps a known service error to its HTTP status', async () => {
        (jest.mocked(
            require('../services/solution.service').reviewSolution
        )).mockRejectedValue(new Error('SOLUTION_NOT_REVIEWABLE'));

        await reviewSolutionController(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            status: 'error',
            message: 'Solution cannot be reviewed in its current state',
        });
    });
});
