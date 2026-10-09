export const CHALLENGE_STATUSES = [
    'DRAFT',
    'OPEN',
    'CLOSED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
] as const;

export type ChallengeStatus =
    (typeof CHALLENGE_STATUSES)[number];