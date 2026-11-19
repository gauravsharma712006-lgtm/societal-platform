import mongoose from 'mongoose';

import { Problem } from '../models/problem.model';
import {
  updateProblemPriority,
  updateProblemStatus,
} from './problem.service';

describe('problem lifecycle service', () => {
  const problemId = '507f1f77bcf86cd799439011';
  const adminId = '507f1f77bcf86cd799439012';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockProblem = (
    status: 'REPORTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED',
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ) => ({
    status,
    priority,
    history: [] as Array<Record<string, unknown>>,
    save: jest.fn().mockResolvedValue(undefined),
  });

  it.each([
    ['REPORTED', 'UNDER_REVIEW'],
    ['UNDER_REVIEW', 'VERIFIED'],
    ['UNDER_REVIEW', 'REJECTED'],
    ['REJECTED', 'UNDER_REVIEW'],
  ] as const)('allows %s -> %s', async (from, to) => {
    const problem = mockProblem(from);
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await updateProblemStatus(
      problemId,
      adminId,
      to,
      to === 'REJECTED' ? 'Insufficient supporting evidence' : undefined
    );

    expect(problem.status).toBe(to);
    expect(problem.history).toContainEqual(expect.objectContaining({
      action: 'STATUS_CHANGED',
      from,
      to,
      changedBy: expect.any(mongoose.Types.ObjectId),
    }));
    expect(problem.save).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['REPORTED', 'VERIFIED'],
    ['REPORTED', 'REJECTED'],
    ['VERIFIED', 'UNDER_REVIEW'],
    ['VERIFIED', 'REJECTED'],
    ['UNDER_REVIEW', 'UNDER_REVIEW'],
  ] as const)('rejects %s -> %s', async (from, to) => {
    const problem = mockProblem(from);
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await expect(updateProblemStatus(
      problemId,
      adminId,
      to,
      to === 'REJECTED' ? 'Insufficient supporting evidence' : undefined
    )).rejects.toThrow('INVALID_STATUS_TRANSITION');

    expect(problem.save).not.toHaveBeenCalled();
  });

  it('requires a rejection reason', async () => {
    const problem = mockProblem('UNDER_REVIEW');
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await expect(updateProblemStatus(
      problemId,
      adminId,
      'REJECTED'
    )).rejects.toThrow('REJECTION_REASON_REQUIRED');
  });

  it('records priority changes in history', async () => {
    const problem = mockProblem('UNDER_REVIEW', 'LOW');
    jest.spyOn(Problem, 'findById').mockResolvedValue(problem as never);

    await updateProblemPriority(problemId, adminId, 'CRITICAL');

    expect(problem.priority).toBe('CRITICAL');
    expect(problem.history).toContainEqual(expect.objectContaining({
      action: 'PRIORITY_CHANGED',
      from: 'LOW',
      to: 'CRITICAL',
    }));
    expect(problem.save).toHaveBeenCalledTimes(1);
  });
});
