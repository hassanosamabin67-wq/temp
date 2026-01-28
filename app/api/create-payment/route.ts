import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    try {
        const { amount, profileId, thinkTankId } = await request.json();

        const { data: thinkTank, error } = await supabase
            .from("thinktank")
            .select("host")
            .eq("id", thinkTankId)
            .single();

        if (error || !thinkTank?.host) {
            return NextResponse.json({ error: "Think Tank creator not found" }, { status: 400 });
        }

        const { data: creatorData, error: creatorError } = await supabase
            .from("users")
            .select("stripe_account_id")
            .eq("userId", thinkTank.host)
            .single();

        if (creatorError || !creatorData?.stripe_account_id) {
            return NextResponse.json({ error: "Stripe account not found for creator" }, { status: 400 });
        }

        const platformFee = Math.round(amount * 0.20);
        const transferAmount = amount - platformFee;

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            payment_method_types: ["card"],
            application_fee_amount: platformFee,
            transfer_data: {
                destination: creatorData.stripe_account_id,
            },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (error) {
        console.error("Internal Error:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error}` },
            { status: 500 }
        );
    }
}