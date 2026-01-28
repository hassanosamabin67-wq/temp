import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { visionary, amount } = await req.json();

        if(!visionary||!amount){
            return NextResponse.json({ error: "Missing Credentials" }, { status: 400 });
        }

        const { data: visionaryData, error: visionaryError } = await supabase
            .from("users")
            .select("stripe_account_id")
            .eq("userId", visionary)
            .single();

        if (visionaryError || !visionaryData?.stripe_account_id) {
            return NextResponse.json({ error: "Visionary does not have a Stripe account connected" }, { status: 400 });
        }

        const amountToPay = Math.round(amount * 0.80);

        const transfer = await stripe.transfers.create({
            amount: amountToPay,
            currency: "usd",
            destination: visionaryData.stripe_account_id,
        });

        return NextResponse.json({ message: "Payment released successfully" });

    } catch (err: any) {
        console.error("Release payment error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}