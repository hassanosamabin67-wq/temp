import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

/**
 * GET /api/ads/lobby
 * Fetch active ads for lobby display
 * 
 * LOBBY ADS LOGIC:
 * - New ads (never shown before): Always show
 * - Previously shown ads: Only show if they have >= 2000 lobby_impressions
 * - Ads visible for 30 days from approval date
 * - Cron job marks ads as 'expired' after 30 days
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const room_id = searchParams.get('room_id');

        if (!room_id) {
            return NextResponse.json(
                { success: false, error: 'room_id is required' },
                { status: 400 }
            );
        }

        // Fetch all active ads for the room
        const { data: ads, error } = await supabase
            .from('ads')
            .select(`
                id,
                title,
                description,
                video_url,
                video_duration,
                impressions_count,
                lobby_impressions,
                created_at,
                approved_at,
                room_id,
                session_id
            `)
            .eq('status', 'active')
            .eq('room_id', room_id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching lobby ads:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch ads' },
                { status: 500 }
            );
        }

        // Filter ads based on lobby impression logic
        const eligibleAds = ads?.filter(ad => {
            const lobbyImpressions = ad.lobby_impressions || 0;

            // If ad has never been shown (0 impressions), it's eligible
            if (lobbyImpressions === 0) {
                return true;
            }

            // If ad has been shown before, only show if >= 2000 impressions
            return lobbyImpressions >= 2000;
        }) || [];

        // Shuffle ads for random rotation
        const shuffledAds = [...eligibleAds].sort(() => Math.random() - 0.5);

        return NextResponse.json({
            success: true,
            ads: shuffledAds,
            count: shuffledAds.length
        });

    } catch (error) {
        console.error('Unexpected error in lobby ads API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}