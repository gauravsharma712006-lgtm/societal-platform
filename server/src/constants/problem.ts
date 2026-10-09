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

export const PROBLEM_STATUSES = [
  'REPORTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
] as const;

export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

export const PROBLEM_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export type ProblemPriority = (typeof PROBLEM_PRIORITIES)[number];