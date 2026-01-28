import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
import {
    AD_PRICE,
    KABOOM_SPLIT_PERCENTAGE,
    VISIONARY_SPLIT_PERCENTAGE,
    calculateRevenueSplit
} from '@/utils/constants/adConstants';

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe Payment Intent for Ad Purchase
 * Implements 70/30 split: 70% to Kaboom, 30% to Visionary
 */
export async function POST(req: NextRequest) {
    try {
        const { ad_id, advertiser_id } = await req.json();

        if (!ad_id || !advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get ad details
        const { data: adData, error: adError } = await supabase
            .from('ads')
            .select(`
                id,
                room_id,
                session_id,
                advertiser_id,
                title,
                status,
                room:thinktank!ads_room_id_fkey(id, title, host)
            `)
            .eq('id', ad_id)
            .single();

        if (adError || !adData) {
            return NextResponse.json(
                { success: false, error: 'Ad not found' },
                { status: 404 }
            );
        }

        // Verify advertiser
        if (adData.advertiser_id !== advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Check if ad is already paid
        const { data: existingPurchase } = await supabase
            .from('ad_purchases')
            .select('id, payment_status')
            .eq('ad_id', ad_id)
            .single();

        if (existingPurchase && existingPurchase.payment_status === 'succeeded') {
            return NextResponse.json(
                { success: false, error: 'Ad has already been paid for' },
                { status: 400 }
            );
        }

        const visionary_id = (adData.room as any)?.host as string;

        if (!visionary_id) {
            return NextResponse.json(
                { success: false, error: 'Room host not found' },
                { status: 404 }
            );
        }

        // Get visionary's Stripe account
        const { data: visionaryData, error: visionaryError } = await supabase
            .from('users')
            .select('stripe_account_id, email, firstName, lastName')
            .eq('userId', visionary_id)
            .single();

        if (visionaryError || !visionaryData?.stripe_account_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Visionary must connect Stripe account to receive payments'
                },
                { status: 400 }
            );
        }

        // Calculate splits
        const revenueSplit = calculateRevenueSplit(AD_PRICE);
        const amountInCents = Math.round(AD_PRICE * 100);
        const visionarySplitInCents = Math.round(revenueSplit.visionarySplit * 100);

        // Create Payment Intent with automatic transfer to visionary
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            payment_method_types: ['card'],
            description: `Ad Purchase: ${adData.title}`,
            metadata: {
                ad_id: ad_id,
                advertiser_id: advertiser_id,
                visionary_id: visionary_id,
                room_id: adData.room_id,
                session_id: adData.session_id || '',
                type: 'ad_purchase'
            },
            transfer_data: {
                amount: visionarySplitInCents,
                destination: visionaryData.stripe_account_id
            }
        });

        // Create purchase record
        const { data: purchaseData, error: purchaseError } = await supabase
            .from('ad_purchases')
            .insert({
                ad_id,
                advertiser_id,
                visionary_id,
                stripe_payment_intent_id: paymentIntent.id,
                amount: AD_PRICE,
                kaboom_split: revenueSplit.kaboomSplit,
                visionary_split: revenueSplit.visionarySplit,
                payment_status: 'pending'
            })
            .select()
            .single();

        if (purchaseError) {
            console.error('Error creating purchase record:', purchaseError);
            // Cancel the payment intent if we couldn't create the purchase record
            await stripe.paymentIntents.cancel(paymentIntent.id);
            return NextResponse.json(
                { success: false, error: 'Failed to create purchase record' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            purchase: purchaseData
        });

    } catch (error: any) {
        console.error('Ad payment error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Update payment status after successful payment
 * This should be called from Stripe webhook
 */
export async function PATCH(req: NextRequest) {
    try {
        const { payment_intent_id, status, charge_id, transfer_id } = await req.json();

        if (!payment_intent_id) {
            return NextResponse.json(
                { success: false, error: 'Payment intent ID required' },
                { status: 400 }
            );
        }

        const updateData: any = {
            payment_status: status,
            updated_at: new Date().toISOString()
        };

        if (status === 'succeeded') {
            updateData.paid_at = new Date().toISOString();
        }

        if (charge_id) {
            updateData.stripe_charge_id = charge_id;
        }

        if (transfer_id) {
            updateData.stripe_transfer_id = transfer_id;
            updateData.transfer_status = 'completed';
            updateData.transferred_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('ad_purchases')
            .update(updateData)
            .eq('stripe_payment_intent_id', payment_intent_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating purchase status:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update purchase status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            purchase: data
        });

    } catch (error: any) {
        console.error('Update payment status error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}