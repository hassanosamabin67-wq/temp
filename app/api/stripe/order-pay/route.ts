import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    try {
        const { amount, orderId, } = await request.json();

        // const { data: { user }, error: authError, } = await supabase.auth.getUser();

        // if (authError || !user) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const { data: order, error: orderError } = await supabase
            .from('order')
            .select('id, client_id, visionary_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
        }

        // if (order.client_id !== user.id) {
        //     return NextResponse.json({ error: "You are not authorized to pay for this order" }, { status: 403 });
        // }

        const { data: visionary, error: visionaryError } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('userId', order.visionary_id)
            .single();

        if (visionaryError || !visionary?.stripe_account_id) {
            return NextResponse.json({ error: "Visionary does not have a Stripe account connected" }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ["card"],
            // payment_method_types: ['card'],
            // transfer_data: {
            //     destination: visionary.stripe_account_id,
            // },
            // metadata: {
            //     order_id: orderId,
            //     client_id: order.client_id,
            //     visionary_id: order.visionary_id,
            // },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });

    } catch (err: any) {
        console.error("Internal Error:", err);
        return NextResponse.json({ error: `Internal Server Error: ${err}` }, { status: 500 });
    }
}