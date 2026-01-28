import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Fetch a single challenge with submissions
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: challenge, error } = await supabase
            .from('community_challenges')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Fetch submissions for this challenge
        // First try to get submissions with joined user data
        const { data: submissions, error: submissionsError } = await supabase
            .from('challenge_submissions')
            .select(`
                *,
                visionary:visionary_id(
                    userId, firstName, lastName, userName, profileImage, isVerified
                )
            `)
            .eq('challenge_id', id)
            .order('vote_count', { ascending: false });

        // If the join fails, fetch submissions without join
        let finalSubmissions = submissions;
        if (submissionsError) {
            console.log('Join query failed, fetching without join:', submissionsError);
            const { data: basicSubmissions } = await supabase
                .from('challenge_submissions')
                .select('*')
                .eq('challenge_id', id)
                .order('vote_count', { ascending: false });

            // Manually fetch user data for each submission
            if (basicSubmissions && basicSubmissions.length > 0) {
                const userIds = [...new Set(basicSubmissions.map(s => s.visionary_id))];
                const { data: users } = await supabase
                    .from('users')
                    .select('userId, firstName, lastName, userName, profileImage')
                    .in('userId', userIds);

                const userMap = new Map(users?.map(u => [u.userId, u]) || []);
                finalSubmissions = basicSubmissions.map(s => ({
                    ...s,
                    visionary: userMap.get(s.visionary_id) || null
                }));
            } else {
                finalSubmissions = basicSubmissions || [];
            }
        }

        // Filter for public display - show approved, finalist, and winner submissions
        const publicSubmissions = (finalSubmissions || []).filter(
            (s: any) => ['pending', 'approved', 'finalist', 'winner'].includes(s.status)
        );

        // Get submission count
        const { count: submissionCount } = await supabase
            .from('challenge_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', id);

        return NextResponse.json({
            success: true,
            challenge: {
                ...challenge,
                submissions: publicSubmissions,
                submission_count: submissionCount || 0,
                finalists: publicSubmissions.filter((s: any) => s.status === 'finalist' || s.status === 'winner')
            }
        });

    } catch (error: any) {
        console.error('Challenge fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update a challenge (Admin only)
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { admin_id, ...updateData } = body;

        if (!admin_id) {
            return NextResponse.json(
                { success: false, error: 'Admin ID required' },
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

        // Update challenge
        const { data, error } = await supabase
            .from('community_challenges')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating challenge:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update challenge' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            challenge: data,
            message: 'Challenge updated successfully'
        });

    } catch (error: any) {
        console.error('Challenge update error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Delete a challenge (Admin only)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const admin_id = searchParams.get('admin_id');

        if (!admin_id) {
            return NextResponse.json(
                { success: false, error: 'Admin ID required' },
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

        // Delete related data first
        await supabase.from('challenge_votes').delete().eq('challenge_id', id);
        await supabase.from('challenge_submissions').delete().eq('challenge_id', id);
        await supabase.from('challenge_badges').delete().eq('challenge_id', id);

        // Delete challenge
        const { error } = await supabase
            .from('community_challenges')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting challenge:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete challenge' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Challenge deleted successfully'
        });

    } catch (error: any) {
        console.error('Challenge delete error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}