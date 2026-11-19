export const PROBLEM_CATEGORIES = [
  'INFRASTRUCTURE',
  'HEALTH',
  'EDUCATION',
  'ENVIRONMENT',
  'TRANSPORTATION',
  'SANITATION',
  'PUBLIC_SAFETY',
  'OTHER',
] as const;

export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

export type ProblemStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type ProblemPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';