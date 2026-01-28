import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

/**
 * GET /api/ads/billing/invoices
 * Fetch all invoices for an advertiser
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const advertiser_id = searchParams.get('advertiser_id');

        if (!advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Advertiser ID required' },
                { status: 400 }
            );
        }

        // Fetch all purchases for the advertiser with ad and room details
        const { data: purchases, error } = await supabase
            .from('ad_purchases')
            .select(`
                id,
                ad_id,
                amount,
                payment_status,
                paid_at,
                created_at,
                stripe_payment_intent_id,
                stripe_charge_id,
                ad:ads!ad_purchases_ad_id_fkey(
                    id,
                    title,
                    room:thinktank!ads_room_id_fkey(
                        id,
                        title
                    )
                )
            `)
            .eq('advertiser_id', advertiser_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch invoices' },
                { status: 500 }
            );
        }

        // Transform data to include ad and room info at the top level
        const invoices = purchases?.map(purchase => ({
            id: purchase.id,
            ad_id: purchase.ad_id,
            amount: purchase.amount,
            payment_status: purchase.payment_status,
            paid_at: purchase.paid_at,
            created_at: purchase.created_at,
            stripe_payment_intent_id: purchase.stripe_payment_intent_id,
            stripe_charge_id: purchase.stripe_charge_id,
            ad_title: (purchase.ad as any)?.title || 'N/A',
            room_title: (purchase.ad as any)?.room?.title || 'N/A'
        })) || [];

        return NextResponse.json({
            success: true,
            invoices: invoices,
            count: invoices.length
        });

    } catch (error: any) {
        console.error('Get invoices error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

