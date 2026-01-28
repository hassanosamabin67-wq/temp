import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { userId, amount, description, hostId, streamId } = await req.json();
        if (!userId || !amount || !hostId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: hostData, error: hostError } = await supabase
            .from("users")
            .select("stripe_account_id")
            .eq("userId", hostId)
            .single();

        if (hostError || !hostData?.stripe_account_id) {
            return NextResponse.json({ error: "Host does not have a Stripe account connected" }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            description: description || "Live Stream Donation",
            payment_method_types: ["card"],
            transfer_data: {
                destination: hostData.stripe_account_id,
                amount: Math.round(amount * 100),
            },
            metadata: {
                userId,
                hostId,
                streamId: streamId || '',
                type: 'stream_donation'
            }
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Stream donation error:', error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}