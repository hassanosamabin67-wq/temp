import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { liveId, userId, eventId } = await req.json();

        const { data: live, error: liveError } = await supabase
            .from("Live")
            .select("id, status, host")
            .eq("id", liveId)
            .single();

        if (liveError || !live) return NextResponse.json({ error: "Live session not found" }, { status: 404 });
        if (live.status !== "end") return NextResponse.json({ error: "Session not ended yet" }, { status: 400 });
        if (live.host === userId) return NextResponse.json({ error: "Host cannot release their own payment" }, { status: 403 });

        const { data: paymentRecord, error: paymentError } = await supabase
            .from("event_payments")
            .select("*")
            .eq("event_id", eventId)
            .eq("participant_id", userId)
            .single();

        if (paymentError || !paymentRecord) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        if (paymentRecord.status === "released") return NextResponse.json({ error: "Payment already released" }, { status: 409 });

        const { data: hostData, error: hostError } = await supabase
            .from("users")
            .select("stripe_account_id")
            .eq("userId", live.host)
            .single();

        if (hostError || !hostData?.stripe_account_id) return NextResponse.json({ error: "Host Stripe account not found" }, { status: 400 });

        const amountToPay = Math.round(paymentRecord.amount * 0.80);

        const transfer = await stripe.transfers.create({
            amount: amountToPay,
            currency: "usd",
            destination: hostData.stripe_account_id,
        });

        await supabase
            .from("event_payments")
            .update({ status: "released", stripe_transfer_id: transfer.id })
            .eq("id", paymentRecord.id);

        return NextResponse.json({ message: "Payment released successfully" });

    } catch (err: any) {
        console.error("Release payment error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}