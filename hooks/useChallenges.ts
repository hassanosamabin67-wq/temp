import { useState, useEffect, useCallback } from 'react';
import { CommunityChallenge, ChallengeSubmission, ChallengeWithSubmissions } from '@/types/challengeTypes';

interface UseChallengesOptions {
    status?: string;
    featured?: boolean;
    limit?: number;
}

export const useChallenges = (options: UseChallengesOptions = {}) => {
    const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (options.status) params.append('status', options.status);
            if (options.featured) params.append('featured', 'true');
            if (options.limit) params.append('limit', options.limit.toString());

            const response = await fetch(`/api/challenges?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setChallenges(data.challenges);
            } else {
                setError(data.error || 'Failed to fetch challenges');
            }
        } catch (err) {
            setError('Failed to fetch challenges');
            console.error('Error fetching challenges:', err);
        } finally {
            setLoading(false);
        }
    }, [options.status, options.featured, options.limit]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    return { challenges, loading, error, refetch: fetchChallenges };
};

export const useChallenge = (challengeId: string) => {
    const [challenge, setChallenge] = useState<ChallengeWithSubmissions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenge = useCallback(async () => {
        if (!challengeId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/challenges/${challengeId}`);
            const data = await response.json();

            if (data.success) {
                setChallenge(data.challenge);
            } else {
                setError(data.error || 'Failed to fetch challenge');
            }
        } catch (err) {
            setError('Failed to fetch challenge');
            console.error('Error fetching challenge:', err);
        } finally {
            setLoading(false);
        }
    }, [challengeId]);

    useEffect(() => {
        fetchChallenge();
    }, [fetchChallenge]);

    return { challenge, loading, error, refetch: fetchChallenge };
};

export const useUserSubmission = (challengeId: string, userId: string | undefined) => {
    const [submission, setSubmission] = useState<ChallengeSubmission | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!challengeId || !userId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/challenges/submissions?challenge_id=${challengeId}&visionary_id=${userId}`
                );
                const data = await response.json();

                if (data.success && data.submissions.length > 0) {
                    setSubmission(data.submissions[0]);
                }
            } catch (err) {
                console.error('Error fetching user submission:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [challengeId, userId]);

    return { submission, loading };
};

export const useUserVote = (challengeId: string, userId: string | undefined) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [votedSubmissionId, setVotedSubmissionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkVote = async () => {
            if (!challengeId || !userId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/challenges/vote?challenge_id=${challengeId}&voter_id=${userId}`
                );
                const data = await response.json();

                if (data.success) {
                    setHasVoted(data.has_voted);
                    setVotedSubmissionId(data.vote?.submission_id || null);
                }
            } catch (err) {
                console.error('Error checking vote:', err);
            } finally {
                setLoading(false);
            }
        };

        checkVote();
    }, [challengeId, userId]);

    return { hasVoted, votedSubmissionId, loading };
};

interface SubmitEntryParams {
    challengeId: string;
    visionaryId: string;
    title: string;
    description: string;
    file: File;
}

export const useSubmitEntry = () => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitEntry = async (params: SubmitEntryParams) => {
        try {
            setSubmitting(true);
            setError(null);

            const formData = new FormData();
            formData.append('challenge_id', params.challengeId);
            formData.append('visionary_id', params.visionaryId);
            formData.append('title', params.title);
            formData.append('description', params.description);
            formData.append('file', params.file);

            const response = await fetch('/api/challenges/submissions', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Failed to submit entry');
                return null;
            }

            return data.submission;
        } catch (err) {
            setError('Failed to submit entry');
            console.error('Error submitting entry:', err);
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    return { submitEntry, submitting, error };
};

interface CastVoteParams {
    challengeId: string;
    submissionId: string;
    voterId: string;
}

export const useCastVote = () => {
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const castVote = async (params: CastVoteParams) => {
        try {
            setVoting(true);
            setError(null);

            const response = await fetch('/api/challenges/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challenge_id: params.challengeId,
                    submission_id: params.submissionId,
                    voter_id: params.voterId
                })
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Failed to cast vote');
                return false;
            }

            return true;
        } catch (err) {
            setError('Failed to cast vote');
            console.error('Error casting vote:', err);
            return false;
        } finally {
            setVoting(false);
        }
    };

    return { castVote, voting, error };
};