import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Select winner for a challenge (Admin only - Kaboom selects winner)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { challenge_id, submission_id, admin_id } = body;

        // Validate required fields
        if (!challenge_id || !submission_id || !admin_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify admin role
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('user_role')
            .eq('userId', admin_id)
            .single();

        if (adminError || adminData?.user_role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // Check if challenge exists and is in voting phase
        const { data: challengeData, error: challengeError } = await supabase
            .from('community_challenges')
            .select('id, status, title, prizes')
            .eq('id', challenge_id)
            .single();

        if (challengeError || !challengeData) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        if (challengeData.status !== 'voting') {
            return NextResponse.json(
                { success: false, error: 'Can only select winner for challenges in voting phase' },
                { status: 400 }
            );
        }

        // Get the winning submission
        const { data: submissionData, error: submissionError } = await supabase
            .from('challenge_submissions')
            .select('id, visionary_id, status, title')
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
                { success: false, error: 'Can only select winner from finalists' },
                { status: 400 }
            );
        }

        // Update submission status to winner
        const { error: updateSubmissionError } = await supabase
            .from('challenge_submissions')
            .update({ status: 'winner', updated_at: new Date().toISOString() })
            .eq('id', submission_id);

        if (updateSubmissionError) {
            console.error('Error updating submission:', updateSubmissionError);
            return NextResponse.json(
                { success: false, error: 'Failed to update submission' },
                { status: 500 }
            );
        }

        // Update challenge with winner and complete status
        const { error: updateChallengeError } = await supabase
            .from('community_challenges')
            .update({
                winner_id: submissionData.visionary_id,
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', challenge_id);

        if (updateChallengeError) {
            console.error('Error updating challenge:', updateChallengeError);
            return NextResponse.json(
                { success: false, error: 'Failed to update challenge' },
                { status: 500 }
            );
        }

        // Get the badge name from prizes
        const prizes = challengeData.prizes as any[];
        const winnerBadge = prizes?.find(p => p.place === 1)?.badge_name || 'Challenge Winner';

        // Award winner badge
        // First, remove any existing winner badge for this challenge
        await supabase
            .from('challenge_badges')
            .delete()
            .eq('challenge_id', challenge_id)
            .eq('badge_type', 'winner');

        // Then create the new winner badge
        await supabase
            .from('challenge_badges')
            .insert({
                user_id: submissionData.visionary_id,
                challenge_id,
                badge_type: 'winner',
                badge_name: winnerBadge,
                awarded_at: new Date().toISOString()
            });

        // Get winner info for response
        const { data: winnerInfo } = await supabase
            .from('users')
            .select('userId, firstName, lastName, userName, email')
            .eq('userId', submissionData.visionary_id)
            .single();

        return NextResponse.json({
            success: true,
            message: 'Winner selected successfully! Challenge completed.',
            winner: {
                user: winnerInfo,
                submission: submissionData,
                badge: winnerBadge
            }
        });

    } catch (error: any) {
        console.error('Winner selection error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}