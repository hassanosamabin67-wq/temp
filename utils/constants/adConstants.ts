/**
 * Kaboom Collab - Paid Video Advertisement Constants
 * 
 * Fixed business rules for the ad system as per requirements
 */

// ========================================
// PRICING & REVENUE SPLIT
// ========================================

/** Fixed price for one ad purchase */
export const AD_PRICE = 25.00;

/** Kaboom platform revenue percentage */
export const KABOOM_SPLIT_PERCENTAGE = 70;

/** Visionary (room host) revenue percentage */
export const VISIONARY_SPLIT_PERCENTAGE = 30;

/** Kaboom dollar amount per ad ($17.50) */
export const KABOOM_SPLIT_AMOUNT = AD_PRICE * (KABOOM_SPLIT_PERCENTAGE / 100);

/** Visionary dollar amount per ad ($7.50) */
export const VISIONARY_SPLIT_AMOUNT = AD_PRICE * (VISIONARY_SPLIT_PERCENTAGE / 100);

// ========================================
// LOBBY AD RULES
// ========================================

/** Lobby ads only run during last N minutes before session start */
export const LOBBY_DURATION_MIN = 30;

/** Maximum number of ads that can rotate during lobby (2 ads per minute × 30 minutes) */
export const LOBBY_MAX_ROTATIONS = 60;

/** Ad rotation rate in lobby (ads per minute) */
export const ROTATION_RATE = 2;

// ========================================
// AD SLOT & CAPACITY
// ========================================

/** Maximum number of ad slots available per session */
export const MAX_AD_SLOTS_PER_SESSION = 10;

// ========================================
// VIDEO SPECIFICATIONS
// ========================================

/** Minimum video length in seconds */
export const VIDEO_LENGTH_MIN = 15;

/** Maximum video length in seconds */
export const VIDEO_LENGTH_MAX = 30;

/** Accepted video formats */
export const ACCEPTED_VIDEO_FORMATS = ['mp4', 'mov'] as const;

/** Maximum video file size in bytes (50MB) */
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

/** MIME types for video validation */
export const ACCEPTED_MIME_TYPES = [
    'video/mp4',
    'video/quicktime'
] as const;

// ========================================
// REPLAY AD RULES
// ========================================

/** Number of days an ad can run on replay after session */
export const REPLAY_AD_WINDOW_DAYS = 30;

/** Maximum impressions before ad expires on replay */
export const REPLAY_IMPRESSION_CAP = 2000;

// ========================================
// AD STATUS
// ========================================

export const AD_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    REJECTED: 'rejected',
    EXPIRED: 'expired'
} as const;

export type AdStatus = typeof AD_STATUS[keyof typeof AD_STATUS];

// ========================================
// PAYMENT STATUS
// ========================================

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// ========================================
// VIEW TYPES
// ========================================

export const VIEW_TYPE = {
    LOBBY: 'lobby',
    REPLAY: 'replay'
} as const;

export type ViewType = typeof VIEW_TYPE[keyof typeof VIEW_TYPE];

// ========================================
// USER-FACING MESSAGES
// ========================================

/** Message displayed to ad buyers */
export const AD_BUYER_MESSAGE =
    `Your $${AD_PRICE} ad will run in the Lobby before the event and on the Replay for up to ${REPLAY_AD_WINDOW_DAYS} days or ${REPLAY_IMPRESSION_CAP.toLocaleString()} views.`;

/** Message displayed to visionaries */
export const VISIONARY_MESSAGE =
    `You earn ${VISIONARY_SPLIT_PERCENTAGE}% of every ad purchased for your session.`;

/** Label for lobby ads */
export const LOBBY_AD_LABEL = 'Sponsored';

/** Label for replay ads with duration */
export const getReplayAdLabel = (duration: number) => `Ad • ${duration} seconds`;

// ========================================
// VALIDATION MESSAGES
// ========================================

export const VALIDATION_MESSAGES = {
    VIDEO_TOO_SHORT: `Video must be at least ${VIDEO_LENGTH_MIN} seconds long.`,
    VIDEO_TOO_LONG: `Video must not exceed ${VIDEO_LENGTH_MAX} seconds.`,
    INVALID_FORMAT: `Video must be in ${ACCEPTED_VIDEO_FORMATS.join(' or ')} format.`,
    FILE_TOO_LARGE: `Video file size must not exceed ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB.`,
    SLOTS_FULL: `This session has reached the maximum of ${MAX_AD_SLOTS_PER_SESSION} ads.`,
    TITLE_REQUIRED: 'Ad title is required.',
    ROOM_REQUIRED: 'Please select a room.',
    SESSION_REQUIRED: 'Please select a session.',
    VIDEO_REQUIRED: 'Please upload a video.'
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if video duration is valid
 */
export const isValidVideoDuration = (duration: number): boolean => {
    return duration >= VIDEO_LENGTH_MIN && duration <= VIDEO_LENGTH_MAX;
};

/**
 * Check if video format is valid
 */
export const isValidVideoFormat = (format: string): boolean => {
    return ACCEPTED_VIDEO_FORMATS.includes(format.toLowerCase() as any);
};

/**
 * Check if MIME type is valid
 */
export const isValidMimeType = (mimeType: string): boolean => {
    return ACCEPTED_MIME_TYPES.includes(mimeType as any);
};

/**
 * Calculate expiration date for ad (30 days from now)
 */
export const calculateExpirationDate = (): Date => {
    const date = new Date();
    date.setDate(date.getDate() + REPLAY_AD_WINDOW_DAYS);
    return date;
};

/**
 * Check if ad has expired
 */
export const isAdExpired = (createdAt: string, impressionsCount: number): boolean => {
    const createdDate = new Date(createdAt);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCreated > REPLAY_AD_WINDOW_DAYS || impressionsCount >= REPLAY_IMPRESSION_CAP;
};

/**
 * Get remaining impressions for an ad
 */
export const getRemainingImpressions = (currentImpressions: number): number => {
    return Math.max(0, REPLAY_IMPRESSION_CAP - currentImpressions);
};

/**
 * Get remaining days for an ad
 */
export const getRemainingDays = (createdAt: string): number => {
    const createdDate = new Date(createdAt);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(REPLAY_AD_WINDOW_DAYS - daysSinceCreated));
};

/**
 * Calculate revenue split for payment
 */
export const calculateRevenueSplit = (amount: number = AD_PRICE) => {
    return {
        total: amount,
        kaboomSplit: amount * (KABOOM_SPLIT_PERCENTAGE / 100),
        visionarySplit: amount * (VISIONARY_SPLIT_PERCENTAGE / 100),
        kaboomPercentage: KABOOM_SPLIT_PERCENTAGE,
        visionaryPercentage: VISIONARY_SPLIT_PERCENTAGE
    };
};

/**
 * Format currency for display
 */
export const formatAdPrice = (price: number = AD_PRICE): string => {
    return `$${price.toFixed(2)}`;
};