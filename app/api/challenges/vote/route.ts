import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Check if user has voted for a specific challenge
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const challenge_id = searchParams.get('challenge_id');
        const voter_id = searchParams.get('voter_id');

        if (!challenge_id || !voter_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const { data: vote, error } = await supabase
            .from('challenge_votes')
            .select('*')
            .eq('challenge_id', challenge_id)
            .eq('voter_id', voter_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking vote:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to check vote status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            has_voted: !!vote,
            vote: vote || null
        });

    } catch (error: any) {
        console.error('Vote check error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST - Cast a vote (Verified Visionaries only, one vote per challenge)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { challenge_id, submission_id, voter_id } = body;

        // Validate required fields
        if (!challenge_id || !submission_id || !voter_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify the user is a verified visionary
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('userId, profileType, status')
            .eq('userId', voter_id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        if (userData.profileType !== 'Visionary') {
            return NextResponse.json(
                { success: false, error: 'Only Visionaries can vote' },
                { status: 403 }
            );
        }

        if (userData.status === 'Pending') {
            return NextResponse.json(
                { success: false, error: 'Only verified Visionaries can vote' },
                { status: 403 }
            );
        }

        // Check if challenge exists and is in voting phase
        const { data: challengeData, error: challengeError } = await supabase
            .from('community_challenges')
            .select('id, status, voting_start_date, voting_end_date')
            .eq('id', challenge_id)
            .single();

        if (challengeError || !challengeData) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Check if voting is active
        const now = new Date();
        let isVotingActive = challengeData.status === 'voting';

        // Also allow voting if status is 'active' and we're within the voting period
        if (!isVotingActive && challengeData.status === 'active') {
            if (challengeData.voting_start_date) {
                const votingStart = new Date(challengeData.voting_start_date);
                const votingEnd = challengeData.voting_end_date ? new Date(challengeData.voting_end_date) : null;

                if (now >= votingStart && (!votingEnd || now <= votingEnd)) {
                    isVotingActive = true;
                }
            }
        }

        if (!isVotingActive) {
            return NextResponse.json(
                { success: false, error: 'Voting is not open for this challenge' },
                { status: 400 }
            );
        }

        // Check if voting period has ended
        if (challengeData.voting_end_date && new Date(challengeData.voting_end_date) < now) {
            return NextResponse.json(
                { success: false, error: 'Voting period has ended' },
                { status: 400 }
            );
        }

        // Check if submission exists and is a finalist
        const { data: submissionData, error: submissionError } = await supabase
            .from('challenge_submissions')
            .select('id, status, visionary_id')
            .eq('id', submission_id)
            .eq('challenge_id', challenge_id)
            .single();

        if (submissionError || !submissionData) {
            return NextResponse.json(
                { success: false, error: 'Submission not found' },
                { status: 404 }
            );
        }

        if (submissionData.status !== 'finalist') {
            return NextResponse.json(
                { success: false, error: 'Can only vote for finalists' },
                { status: 400 }
            );
        }

        // Prevent voting for own submission
        if (submissionData.visionary_id === voter_id) {
            return NextResponse.json(
                { success: false, error: 'Cannot vote for your own submission' },
                { status: 400 }
            );
        }

        // Check if user has already voted in this challenge
        const { data: existingVote } = await supabase
            .from('challenge_votes')
            .select('id')
            .eq('challenge_id', challenge_id)
            .eq('voter_id', voter_id)
            .single();

        if (existingVote) {
            return NextResponse.json(
                { success: false, error: 'You have already voted in this challenge', already_voted: true },
                { status: 400 }
            );
        }

        // Create vote
        const { data: vote, error: voteError } = await supabase
            .from('challenge_votes')
            .insert({
                challenge_id,
                submission_id,
                voter_id
            })
            .select()
            .single();

        if (voteError) {
            console.error('Error creating vote:', voteError);
            return NextResponse.json(
                { success: false, error: 'Failed to cast vote' },
                { status: 500 }
            );
        }

        // Increment vote count on submission
        await supabase.rpc('increment_vote_count', { submission_id });

        // If RPC doesn't exist, use manual update
        const { data: currentSubmission } = await supabase
            .from('challenge_submissions')
            .select('vote_count')
            .eq('id', submission_id)
            .single();

        if (currentSubmission) {
            await supabase
                .from('challenge_submissions')
                .update({ vote_count: (currentSubmission.vote_count || 0) + 1 })
                .eq('id', submission_id);
        }

        return NextResponse.json({
            success: true,
            vote,
            message: 'Vote cast successfully'
        });

    } catch (error: any) {
        console.error('Vote creation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}