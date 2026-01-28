import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { eventHostId, amount, description } = await req.json();

        if (!eventHostId || !amount || !description) return NextResponse.json({ error: "Missing Credentials" }, { status: 400 });

        const { data: eventHostData, error } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('userId', eventHostId)
            .single();

        if (error || !eventHostData?.stripe_account_id) {
            return NextResponse.json({ error: "Host's Stripe account not found." }, { status: 400 });
        }

        const platformFee = Math.round(amount * 0.20);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            description,
            payment_method_types: ["card"],
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });

    } catch (err: any) {
        console.error('Event Payment Error: ', err);
        return NextResponse.json({ error: `Event Payment Error: ${err.message}` }, { status: 500 });
    }
}