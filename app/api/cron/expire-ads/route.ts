import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { REPLAY_AD_WINDOW_DAYS, REPLAY_IMPRESSION_CAP } from '@/utils/constants/adConstants';

/**
 * Cron job to mark ads as expired
 * Should be run periodically (e.g., every hour or daily)
 * 
 * Ads expire when:
 * 1. They are 30+ days old from APPROVAL date (for lobby ads)
 * 2. They reach 2000 impressions (for replay ads)
 * 
 * Note: Lobby ads show for 30 days regardless of impressions
 *       Replay ads stop showing after 2000 impressions OR 30 days
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (optional but recommended for security)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = new Date();
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - REPLAY_AD_WINDOW_DAYS);

        // Find active ads that should be expired
        // Expire if: 30+ days from approval OR 2000+ impressions
        const { data: adsToExpire, error: fetchError } = await supabase
            .from('ads')
            .select('id, title, impressions_count, approved_at, created_at')
            .eq('status', 'active')
            .or(`impressions_count.gte.${REPLAY_IMPRESSION_CAP},approved_at.lt.${expirationDate.toISOString()}`);

        if (fetchError) {
            console.error('Error fetching ads to expire:', fetchError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch ads' },
                { status: 500 }
            );
        }

        if (!adsToExpire || adsToExpire.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No ads to expire',
                expired: 0
            });
        }

        // Get ad IDs to expire
        const adIdsToExpire = adsToExpire.map(ad => ad.id);

        // Update ads to expired status
        const { data: expiredAds, error: updateError } = await supabase
            .from('ads')
            .update({
                status: 'expired',
                updated_at: now.toISOString()
            })
            .in('id', adIdsToExpire)
            .select();

        if (updateError) {
            console.error('Error expiring ads:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to expire ads' },
                { status: 500 }
            );
        }

        // Log the expired ads
        console.log(`Expired ${expiredAds?.length || 0} ads:`, {
            ads: adsToExpire.map(ad => ({
                id: ad.id,
                title: ad.title,
                impressions: ad.impressions_count,
                days_since_approval: Math.floor((now.getTime() - new Date(ad.approved_at || ad.created_at).getTime()) / (1000 * 60 * 60 * 24))
            }))
        });

        return NextResponse.json({
            success: true,
            message: `Successfully expired ${expiredAds?.length || 0} ads`,
            expired: expiredAds?.length || 0,
            ads: expiredAds
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Manual trigger for testing (POST method)
 */
export async function POST(req: NextRequest) {
    return GET(req);
}