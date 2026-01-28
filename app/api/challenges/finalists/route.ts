import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Get finalists for a challenge
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const challenge_id = searchParams.get('challenge_id');

        if (!challenge_id) {
            return NextResponse.json(
                { success: false, error: 'Challenge ID required' },
                { status: 400 }
            );
        }

        const { data: finalists, error } = await supabase
            .from('challenge_submissions')
            .select(`
                *,
                visionary:users!challenge_submissions_visionary_id_fkey(
                    userId, firstName, lastName, userName, profileImage, isVerified
                )
            `)
            .eq('challenge_id', challenge_id)
            .in('status', ['finalist', 'winner'])
            .order('vote_count', { ascending: false });

        if (error) {
            console.error('Error fetching finalists:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch finalists' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            finalists,
            count: finalists.length
        });

    } catch (error: any) {
        console.error('Finalists fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST - Select finalists for a challenge (Admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { challenge_id, submission_ids, admin_id } = body;

        // Validate required fields
        if (!challenge_id || !submission_ids || !admin_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate number of finalists (3-5)
        if (!Array.isArray(submission_ids) || submission_ids.length < 3 || submission_ids.length > 5) {
            return NextResponse.json(
                { success: false, error: 'Must select 3-5 finalists' },
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

        // Check if challenge exists and is active
        const { data: challengeData, error: challengeError } = await supabase
            .from('community_challenges')
            .select('id, status')
            .eq('id', challenge_id)
            .single();

        if (challengeError || !challengeData) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        if (challengeData.status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Can only select finalists for active challenges' },
                { status: 400 }
            );
        }

        // Reset any existing finalists to approved
        await supabase
            .from('challenge_submissions')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('challenge_id', challenge_id)
            .eq('status', 'finalist');

        // Set new finalists
        const { error: updateError } = await supabase
            .from('challenge_submissions')
            .update({ status: 'finalist', updated_at: new Date().toISOString() })
            .in('id', submission_ids);

        if (updateError) {
            console.error('Error updating finalists:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to select finalists' },
                { status: 500 }
            );
        }

        // Award finalist badges
        const { data: submissions } = await supabase
            .from('challenge_submissions')
            .select('visionary_id')
            .in('id', submission_ids);

        if (submissions) {
            for (const submission of submissions) {
                // Check if badge already exists
                const { data: existingBadge } = await supabase
                    .from('challenge_badges')
                    .select('id')
                    .eq('user_id', submission.visionary_id)
                    .eq('challenge_id', challenge_id)
                    .eq('badge_type', 'finalist')
                    .single();

                if (!existingBadge) {
                    await supabase
                        .from('challenge_badges')
                        .insert({
                            user_id: submission.visionary_id,
                            challenge_id,
                            badge_type: 'finalist',
                            badge_name: 'Challenge Finalist',
                            awarded_at: new Date().toISOString()
                        });
                }
            }
        }

        // Update challenge status to voting
        await supabase
            .from('community_challenges')
            .update({
                status: 'voting',
                voting_start_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', challenge_id);

        return NextResponse.json({
            success: true,
            message: 'Finalists selected successfully. Voting phase started.'
        });

    } catch (error: any) {
        console.error('Finalists selection error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}