// Community Challenge Constants

export const CHALLENGE_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    VOTING: 'voting',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

export const SUBMISSION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    FINALIST: 'finalist',
    WINNER: 'winner'
} as const;

export const BADGE_TYPES = {
    WINNER: 'winner',
    FINALIST: 'finalist',
    PARTICIPANT: 'participant'
} as const;

export const CHALLENGE_CATEGORIES = [
    'Visual Arts',
    'Music',
    'Writing',
    'Video',
    'Design',
    'Other'
] as const;

export const MAX_FINALISTS = 5;
export const MIN_FINALISTS = 3;

export const ACCEPTED_FILE_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: ['application/pdf']
};

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const VALIDATION_MESSAGES = {
    NOT_VERIFIED_VISIONARY: 'Only verified Visionaries can participate in challenges',
    ALREADY_SUBMITTED: 'You have already submitted to this challenge',
    DEADLINE_PASSED: 'The submission deadline has passed',
    CHALLENGE_NOT_ACTIVE: 'This challenge is not accepting submissions',
    ALREADY_VOTED: 'You have already voted in this challenge',
    VOTING_NOT_OPEN: 'Voting is not currently open for this challenge',
    CANNOT_VOTE_OWN: 'You cannot vote for your own submission',
    FINALISTS_RANGE: `Please select ${MIN_FINALISTS}-${MAX_FINALISTS} finalists`
};

// Database table names
export const DB_TABLES = {
    CHALLENGES: 'community_challenges',
    SUBMISSIONS: 'challenge_submissions',
    VOTES: 'challenge_votes',
    BADGES: 'challenge_badges'
} as const;

// Storage bucket name
export const STORAGE_BUCKET = 'challenge-submissions';