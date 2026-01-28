import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Fetch all challenges (public) or filtered by status
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const featured = searchParams.get('featured');
        const limit = searchParams.get('limit');

        let query = supabase
            .from('community_challenges')
            .select('*')
            .order('created_at', { ascending: false });

        // Only show active, voting, or completed challenges to public
        if (status) {
            query = query.eq('status', status);
        } else {
            query = query.in('status', ['active', 'voting', 'completed']);
        }

        if (featured === 'true') {
            query = query.eq('featured_on_homepage', true);
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching challenges:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch challenges' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            challenges: data,
            count: data.length
        });

    } catch (error: any) {
        console.error('Challenges fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST - Create a new challenge (Admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            title,
            brief,
            description,
            category,
            submission_format,
            deadline,
            voting_start_date,
            voting_end_date,
            cover_image,
            prizes,
            rules,
            created_by,
            featured_on_homepage
        } = body;

        // Validate required fields
        if (!title || !brief || !description || !category || !submission_format || !deadline || !created_by) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify admin role
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('user_role')
            .eq('userId', created_by)
            .single();

        if (adminError || adminData?.user_role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // Create challenge
        const { data, error } = await supabase
            .from('community_challenges')
            .insert({
                title,
                brief,
                description,
                category,
                submission_format,
                deadline,
                voting_start_date,
                voting_end_date,
                cover_image,
                prizes: prizes || [],
                rules: rules || [],
                created_by,
                featured_on_homepage: featured_on_homepage || false,
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating challenge:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create challenge' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            challenge: data,
            message: 'Challenge created successfully'
        });

    } catch (error: any) {
        console.error('Challenge creation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}