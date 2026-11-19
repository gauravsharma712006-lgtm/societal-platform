import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/user.model';
import * as solutionService from '../src/services/solution.service';
import * as mediaService from '../src/services/media.service';

jest.mock('../src/services/solution.service');
jest.mock('../src/services/media.service');

const solutionId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439013';
const evidence = {
    key: `solutions/${solutionId}/evidence.jpg`,
    originalName: 'evidence.jpg',
    contentType: 'image/jpeg',
    size: 1024,
};

describe('Solution evidence route validation and controller integration', () => {
    let token: string;

    beforeEach(() => {
        jest.resetAllMocks();
        token = jwt.sign({ userId, role: 'STUDENT' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        jest.spyOn(User, 'findById').mockReturnValue({
            select: () => Promise.resolve({ _id: userId, role: 'STUDENT' }),
        } as never);
        jest.mocked(solutionService.getSolutionById).mockResolvedValue({ _id: solutionId } as never);
        jest.mocked(solutionService.createSolutionEvidenceUpload).mockResolvedValue(evidence);
        jest.mocked(solutionService.attachSolutionEvidence).mockResolvedValue({ _id: solutionId } as never);
        jest.mocked(solutionService.getSolutionEvidence).mockResolvedValue(evidence as never);
        jest.mocked(mediaService.createUploadUrl).mockResolvedValue('https://example.test/upload');
        jest.mocked(mediaService.createDownloadUrl).mockResolvedValue('https://example.test/download');
        jest.mocked(mediaService.getObjectMetadata).mockResolvedValue({ contentType: evidence.contentType, size: evidence.size });
        jest.mocked(mediaService.validateImageContent).mockResolvedValue(true);
    });

    afterEach(() => jest.restoreAllMocks());

    it('generates a size-bound upload using the canonical URL ID after validation', async () => {
        const response = await request(app)
            .post(`/api/solutions/${solutionId}/evidence/upload-url`)
            .set('Authorization', `Bearer ${token}`)
            .send({ fileName: evidence.originalName, contentType: evidence.contentType, size: evidence.size });

        expect(response.status).toBe(200);
        expect(solutionService.createSolutionEvidenceUpload).toHaveBeenCalledWith(
            solutionId, userId, evidence.originalName, evidence.contentType, evidence.size
        );
        expect(mediaService.createUploadUrl).toHaveBeenCalledWith(evidence.key, evidence.contentType, evidence.size);
    });

    it('attaches validated evidence even though validation removes the redundant body ID', async () => {
        const response = await request(app)
            .post(`/api/solutions/${solutionId}/evidence`)
            .set('Authorization', `Bearer ${token}`)
            .send({ solutionId, ...evidence });

        expect(response.status).toBe(201);
        expect(solutionService.attachSolutionEvidence).toHaveBeenCalledWith(solutionId, userId, evidence);
    });

    it('authorizes downloads against the URL ID even when a conflicting body ID is supplied', async () => {
        const response = await request(app)
            .post(`/api/solutions/${solutionId}/evidence/download-url`)
            .set('Authorization', `Bearer ${token}`)
            .send({ solutionId: '507f1f77bcf86cd799439014', key: evidence.key });

        expect(response.status).toBe(200);
        expect(solutionService.getSolutionEvidence).toHaveBeenCalledWith(solutionId, userId, evidence.key, false);
    });

    it('does not probe storage for an unauthorized solution attachment', async () => {
        jest.mocked(solutionService.getSolutionById).mockRejectedValue(new Error('NOT_A_TEAM_MEMBER'));
        const response = await request(app)
            .post(`/api/solutions/${solutionId}/evidence`)
            .set('Authorization', `Bearer ${token}`)
            .send(evidence);

        expect(response.status).toBe(403);
        expect(mediaService.getObjectMetadata).not.toHaveBeenCalled();
        expect(solutionService.attachSolutionEvidence).not.toHaveBeenCalled();
    });
});
