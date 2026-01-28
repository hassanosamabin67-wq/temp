import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Reject an ad submission and process refund
 * Only admins can reject ads
 */
export async function POST(req: NextRequest) {
    try {
        const { ad_id, admin_id, rejection_reason } = await req.json();

        if (!ad_id || !admin_id || !rejection_reason) {
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

        // Check if ad is pending
        if (adData.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: `Ad is already ${adData.status}` },
                { status: 400 }
            );
        }

        // Get purchase record to process refund
        const { data: purchaseData, error: purchaseError } = await supabase
            .from('ad_purchases')
            .select('*')
            .eq('ad_id', ad_id)
            .eq('payment_status', 'succeeded')
            .single();

        // Process refund if payment was successful
        let refundId = null;
        if (purchaseData && !purchaseError) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: purchaseData.stripe_payment_intent_id,
                    reason: 'requested_by_customer',
                    metadata: {
                        ad_id: ad_id,
                        rejection_reason: rejection_reason
                    }
                });

                refundId = refund.id;

                // Update purchase status
                await supabase
                    .from('ad_purchases')
                    .update({
                        payment_status: 'refunded',
                        updated_at: new Date().toISOString(),
                        metadata: { refund_id: refundId, rejection_reason }
                    })
                    .eq('id', purchaseData.id);

            } catch (refundError: any) {
                console.error('Refund error:', refundError);
                // Continue with rejection even if refund fails
            }
        }

        // Update ad status to rejected
        const { data: updatedAd, error: updateError } = await supabase
            .from('ads')
            .update({
                status: 'rejected',
                rejection_reason,
                approved_by: admin_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', ad_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error rejecting ad:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to reject ad' },
                { status: 500 }
            );
        }

        // Send rejection email to advertiser
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin-email/ad-notifications/ad-rejected`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adTitle: adData.title,
                    roomTitle: adData.room?.title || 'Unknown Room',
                    advertiserEmail: adData.advertiser?.email,
                    advertiserName: `${adData.advertiser?.firstName || ''} ${adData.advertiser?.lastName || ''}`.trim() || 'Advertiser',
                    rejectionReason: rejection_reason
                })
            });
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
            // Don't fail the rejection if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Ad rejected successfully',
            ad: updatedAd,
            refunded: !!refundId
        });

    } catch (error: any) {
        console.error('Ad rejection error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}