import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

/**
 * GET /api/ads/replay
 * Fetch 1 random eligible ad for replay pre-roll
 * 
 * REPLAY ADS LOGIC:
 * - Serve 1 random ad that meets ALL conditions:
 *   - status = 'active'
 *   - impressions_count < 2000
 *   - approved_at is within last 30 days
 * - If no eligible ads: return empty (show Kaboom promo)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const room_id = searchParams.get('room_id');
        const session_id = searchParams.get('session_id');

        if (!room_id) {
            return NextResponse.json(
                { success: false, error: 'room_id is required' },
                { status: 400 }
            );
        }

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch eligible ads
        const { data: ads, error } = await supabase
            .from('ads')
            .select(`
                id,
                title,
                description,
                video_url,
                video_duration,
                impressions_count,
                created_at,
                approved_at,
                room_id,
                session_id
            `)
            .eq('status', 'active')
            .eq('room_id', room_id)
            .lt('impressions_count', 2000)
            .gte('approved_at', thirtyDaysAgo.toISOString());

        if (error) {
            console.error('Error fetching replay ads:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch ads' },
                { status: 500 }
            );
        }

        // If no eligible ads, return empty
        if (!ads || ads?.length === 0) {
            return NextResponse.json({
                success: true,
                ads: null,
                message: 'No eligible ads available'
            });
        }

        // Pick 1 random ad from eligible ads
        const randomAd = [...ads].sort(() => Math.random() - 0.5);

        return NextResponse.json({
            success: true,
            ads: randomAd
        });

    } catch (error) {
        console.error('Unexpected error in replay ads API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}