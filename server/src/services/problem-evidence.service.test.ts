import mongoose from 'mongoose';

import { Problem } from '../models/problem.model';
import {
  requestAdditionalEvidence,
  respondToEvidenceRequest,
} from './problem.service';

describe('problem evidence request service', () => {
  const problemId = '507f1f77bcf86cd799439011';
  const reporterId = '507f1f77bcf86cd799439012';
  const adminId = '507f1f77bcf86cd799439013';
  const requestId = new mongoose.Types.ObjectId();
  const mediaKey = `problems/${problemId}/evidence.jpg`;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const makeProblem = () => ({
    status: 'UNDER_REVIEW',
    reportedBy: new mongoose.Types.ObjectId(reporterId),
    evidenceRequests: [] as Array<Record<string, any>>,
    history: [] as Array<Record<string, unknown>>,
    media: [{ key: mediaKey }],
    save: jest.fn().mockResolvedValue(undefined),
  });

  it('creates a pending evidence request and history entry', async () => {
    const problem = makeProblem();
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await requestAdditionalEvidence(
      problemId,
      adminId,
      'Please upload a wider photo of the affected area.'
    );

    expect(problem.evidenceRequests).toContainEqual(expect.objectContaining({
      status: 'PENDING',
      responseMediaKeys: [],
    }));
    expect(problem.history).toContainEqual(expect.objectContaining({
      action: 'EVIDENCE_REQUESTED',
    }));
    expect(problem.save).toHaveBeenCalledTimes(1);
  });

  it('rejects evidence requests for completed review states', async () => {
    const problem = makeProblem();
    problem.status = 'VERIFIED';
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await expect(requestAdditionalEvidence(
      problemId,
      adminId,
      'Please upload another image.'
    )).rejects.toThrow('INVALID_EVIDENCE_REQUEST_STATUS');
  });

  it('prevents another user from responding', async () => {
    const problem = makeProblem();
    problem.evidenceRequests.push({
      _id: requestId,
      status: 'PENDING',
      responseMediaKeys: [],
    });
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await expect(respondToEvidenceRequest(
      problemId,
      requestId.toString(),
      adminId,
      [mediaKey]
    )).rejects.toThrow('FORBIDDEN');
  });

  it('prevents a second response to the same request', async () => {
    const problem = makeProblem();
    problem.evidenceRequests.push({
      _id: requestId,
      status: 'RESPONDED',
      responseMediaKeys: [mediaKey],
    });
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await expect(respondToEvidenceRequest(
      problemId,
      requestId.toString(),
      reporterId,
      [mediaKey]
    )).rejects.toThrow('EVIDENCE_REQUEST_ALREADY_RESPONDED');
  });

  it('rejects media that is not attached to the same problem', async () => {
    const problem = makeProblem();
    problem.evidenceRequests.push({
      _id: requestId,
      status: 'PENDING',
      responseMediaKeys: [],
    });
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await expect(respondToEvidenceRequest(
      problemId,
      requestId.toString(),
      reporterId,
      [`problems/${problemId}/unattached.jpg`]
    )).rejects.toThrow('INVALID_RESPONSE_MEDIA');
  });

  it('marks a valid reporter response as responded', async () => {
    const problem = makeProblem();
    const evidenceRequest = {
      _id: requestId,
      status: 'PENDING',
      responseMediaKeys: [] as string[],
      respondedAt: undefined as Date | undefined,
    };
    problem.evidenceRequests.push(evidenceRequest);
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await respondToEvidenceRequest(
      problemId,
      requestId.toString(),
      reporterId,
      [mediaKey, mediaKey]
    );

    expect(evidenceRequest.status).toBe('RESPONDED');
    expect(evidenceRequest.respondedAt).toBeInstanceOf(Date);
    expect(evidenceRequest.responseMediaKeys).toEqual([mediaKey]);
    expect(problem.save).toHaveBeenCalledTimes(1);
  });
});
