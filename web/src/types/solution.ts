
export type SolutionReviewStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED';

export type SolutionImplementationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED';

export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type SolutionHistoryAction =
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'REVISION_REQUESTED'
  | 'IMPLEMENTATION_STATUS_CHANGED'
  | 'MILESTONE_UPDATED'
  | 'IMPACT_RECORDED'
  | 'EVIDENCE_ADDED';

export interface SolutionEvidence {
  _id?: string;
  key: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface SolutionMilestone {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: MilestoneStatus;
  completedAt?: string;
}

export interface SolutionImpact {
  _id?: string;
  name: string;
  description?: string;
  unit: string;
  baselineValue?: number;
  measuredValue?: number;
  measuredAt?: string;
  notes?: string;
  evidenceKeys: string[];
}

export interface SolutionHistory {
  _id?: string;
  action: SolutionHistoryAction;
  from?: string;
  to?: string;
  changedBy: string;
  note?: string;
  changedAt: string;
}

export interface Solution {
  _id: string;
  challenge: string;
  team: string;
  submittedBy: string;

  title: string;
  description: string;
  approach: string;
  estimatedCost?: number;
  estimatedCompletionDate?: string;

  reviewStatus: SolutionReviewStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;

  implementationStatus: SolutionImplementationStatus;
  milestones: SolutionMilestone[];
  impactIndicators: SolutionImpact[];
  evidence: SolutionEvidence[];
  history: SolutionHistory[];

  createdAt: string;
  updatedAt: string;
}
