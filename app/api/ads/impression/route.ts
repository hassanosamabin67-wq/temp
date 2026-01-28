import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

/**
 * POST /api/ads/impression
 * Record an ad impression when an ad is shown to a viewer
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ad_id, viewer_id, session_id, view_type } = body;

        if (!ad_id || !view_type) {
            return NextResponse.json(
                { success: false, error: 'ad_id and view_type are required' },
                { status: 400 }
            );
        }

        if (view_type !== 'replay') {
            return NextResponse.json(
                { success: false, error: 'view_type must be "replay"' },
                { status: 400 }
            );
        }

        // Record impression in ad_impressions table
        const { error: impressionError } = await supabase
            .from('ad_impressions')
            .insert({
                ad_id,
                viewer_id: viewer_id || null,
                session_id: session_id || null,
                view_type,
                impression_date: new Date().toISOString()
            });

        if (impressionError) {
            console.error('Error recording impression:', impressionError);
            return NextResponse.json(
                { success: false, error: 'Failed to record impression' },
                { status: 500 }
            );
        }

        // Fetch current ad data
        const { data: currentAd } = await supabase
            .from('ads')
            .select('impressions_count')
            .eq('id', ad_id)
            .single();

        if (currentAd) {
            const newImpressionCount = (currentAd.impressions_count || 0) + 1;

            // Update impression count
            const { error: updateError } = await supabase
                .from('ads')
                .update({
                    impressions_count: newImpressionCount,
                    replay_impressions: newImpressionCount // Keep in sync
                })
                .eq('id', ad_id);

            if (updateError) {
                console.error('Error updating impression count:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to update impression count' },
                    { status: 500 }
                );
            }

            // If reached 2000 impressions, mark as expired
            if (newImpressionCount >= 2000) {
                await supabase
                    .from('ads')
                    .update({
                        status: 'expired',
                        expires_at: new Date().toISOString()
                    })
                    .eq('id', ad_id);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Impression recorded successfully'
        });

    } catch (error) {
        console.error('Unexpected error in impression API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}