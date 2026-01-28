import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Approve an ad submission
 * Only admins can approve ads
 */
export async function POST(req: NextRequest) {
    try {
        const { ad_id, admin_id } = await req.json();

        if (!ad_id || !admin_id) {
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

        // Get ad details before updating
        const { data: adData, error: adFetchError } = await supabase
            .from('ads')
            .select(`
                *,
                advertiser:users!ads_advertiser_id_fkey(userId, email, firstName, lastName),
                room:thinktank!ads_room_id_fkey(id, title)
            `)
            .eq('id', ad_id)
            .single();

        if (adFetchError || !adData) {
            return NextResponse.json(
                { success: false, error: 'Ad not found' },
                { status: 404 }
            );
        }

        // Check if ad is already approved or rejected
        if (adData.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: `Ad is already ${adData.status}` },
                { status: 400 }
            );
        }

        // Update ad status to active
        const { data: updatedAd, error: updateError } = await supabase
            .from('ads')
            .update({
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: admin_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', ad_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error approving ad:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to approve ad' },
                { status: 500 }
            );
        }

        // Send approval email to advertiser
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin-email/ad-notifications/ad-approved`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adTitle: adData.title,
                    roomTitle: adData.room?.title || 'Unknown Room',
                    advertiserEmail: adData.advertiser?.email,
                    advertiserName: `${adData.advertiser?.firstName || ''} ${adData.advertiser?.lastName || ''}`.trim() || 'Advertiser'
                })
            });
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            // Don't fail the approval if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Ad approved successfully',
            ad: updatedAd
        });

    } catch (error: any) {
        console.error('Ad approval error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}