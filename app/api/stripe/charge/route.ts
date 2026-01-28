import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {

        const { clientId, amount } = await req.json();
        // const { clientId, amount, description, paymentMethodId } = await req.json();

        if (!clientId || !amount) return NextResponse.json({ error: "Missing Credentials" }, { status: 400 });
        // if (!clientId || !amount || !description || !paymentMethodId) return NextResponse.json({ error: "Missing Credentials" }, { status: 400 });

        const { data: clientData, error } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('userId', clientId)
            .single();

        if (error || !clientData?.stripe_customer_id) {
            return NextResponse.json({ error: 'Stripe customer not found.' }, { status: 400 });
        }

        // const paymentIntent = await stripe.paymentIntents.create({
        //     amount: Math.round(amount * 100),
        //     currency: 'usd',
        //     customer: clientData.stripe_customer_id,
        //     description,
        //     payment_method: paymentMethodId,
        //     confirm: true,
        //     automatic_payment_methods: {
        //         enabled: true,
        //         allow_redirects: 'never'
        //     }
        // });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ["card"],
        });

        return NextResponse.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, status: paymentIntent.status});
    } catch (err: any) {
        console.error('Stripe payment error:', err);
        return NextResponse.json({ error: `Internal server error ${err.message}` }, { status: 500 });
    }
}