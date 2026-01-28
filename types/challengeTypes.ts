// Community Challenge Types

export type ChallengeStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'finalist' | 'winner';

export interface CommunityChallenge {
    id: string;
    title: string;
    brief: string;
    description: string;
    category: string;
    submission_format: string; // e.g., "JPEG/PNG - 3000x3000px", "MP3 - Max 5MB"
    deadline: string;
    voting_start_date?: string;
    voting_end_date?: string;
    status: ChallengeStatus;
    cover_image?: string;
    prizes: ChallengePrize[];
    rules: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
    winner_id?: string;
    featured_on_homepage?: boolean;
}

export interface ChallengePrize {
    place: number;
    title: string;
    description: string;
    badge_name?: string;
}

export interface ChallengeSubmission {
    id: string;
    challenge_id: string;
    visionary_id: string;
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    thumbnail_url?: string;
    status: SubmissionStatus;
    vote_count: number;
    created_at: string;
    updated_at: string;
    // Joined data
    visionary?: {
        userId: string;
        firstName: string;
        lastName: string;
        userName: string;
        profileImage: string;
        isVerified: boolean;
    };
    challenge?: CommunityChallenge;
}

export interface ChallengeVote {
    id: string;
    challenge_id: string;
    submission_id: string;
    voter_id: string;
    created_at: string;
}

export interface ChallengeBadge {
    id: string;
    user_id: string;
    challenge_id: string;
    badge_type: 'winner' | 'finalist' | 'participant';
    badge_name: string;
    badge_image_url?: string;
    awarded_at: string;
    // Joined data
    challenge?: CommunityChallenge;
}

export interface ChallengeWithSubmissions extends CommunityChallenge {
    submissions: ChallengeSubmission[];
    submission_count: number;
    finalists?: ChallengeSubmission[];
}

// Form types for creating/editing challenges
export interface CreateChallengeForm {
    title: string;
    brief: string;
    description: string;
    category: string;
    submission_format: string;
    deadline: string;
    voting_start_date?: string;
    voting_end_date?: string;
    cover_image?: File | string;
    prizes: ChallengePrize[];
    rules: string[];
}

export interface CreateSubmissionForm {
    title: string;
    description: string;
    file: File;
}

// API Response types
export interface ChallengeApiResponse {
    success: boolean;
    challenge?: CommunityChallenge;
    challenges?: CommunityChallenge[];
    error?: string;
    message?: string;
}

export interface SubmissionApiResponse {
    success: boolean;
    submission?: ChallengeSubmission;
    submissions?: ChallengeSubmission[];
    error?: string;
    message?: string;
}

export interface VoteApiResponse {
    success: boolean;
    vote?: ChallengeVote;
    error?: string;
    message?: string;
    already_voted?: boolean;
}

// Statistics for admin dashboard
export interface ChallengeStatistics {
    total_challenges: number;
    active_challenges: number;
    completed_challenges: number;
    total_submissions: number;
    total_votes: number;
    total_participants: number;
}