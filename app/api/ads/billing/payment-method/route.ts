import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/ads/billing/payment-method
 * Fetch payment method details for an advertiser
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

        // Get the most recent successful purchase to retrieve payment method
        const { data: recentPurchase, error: purchaseError } = await supabase
            .from('ad_purchases')
            .select('stripe_payment_intent_id, stripe_charge_id')
            .eq('advertiser_id', advertiser_id)
            .eq('payment_status', 'succeeded')
            .order('paid_at', { ascending: false })
            .limit(1)
            .single();

        if (purchaseError || !recentPurchase) {
            return NextResponse.json(
                { success: false, error: 'No payment method found' },
                { status: 404 }
            );
        }

        // Retrieve payment intent from Stripe to get payment method details
        const paymentIntent = await stripe.paymentIntents.retrieve(
            recentPurchase.stripe_payment_intent_id
        );

        if (!paymentIntent || !paymentIntent.payment_method) {
            return NextResponse.json(
                { success: false, error: 'Payment method not found' },
                { status: 404 }
            );
        }

        // Retrieve payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentIntent.payment_method
        );

        // Extract card details
        const cardDetails = paymentMethod.card || {};

        return NextResponse.json({
            success: true,
            paymentMethod: {
                brand: cardDetails.brand,
                last4: cardDetails.last4,
                exp_month: cardDetails.exp_month,
                exp_year: cardDetails.exp_year,
                type: paymentMethod.type
            }
        });

    } catch (error: any) {
        console.error('Get payment method error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

