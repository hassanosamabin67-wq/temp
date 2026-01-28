import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/config/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

        const { data: user, error: userErr } = await supabase
            .from("users")
            .select("stripe_account_id")
            .eq("userId", userId)
            .single();

        if (userErr || !user?.stripe_account_id) {
            return NextResponse.json({ error: "No Stripe account for user" }, { status: 404 });
        }

        const account = await stripe.accounts.retrieve(user.stripe_account_id);

        // Capabilities (can be undefined on the type; compare safely)
        const transfersActive = account.capabilities?.transfers === "active";
        const cardsActive = account.capabilities?.card_payments === "active";

        // Requirements — read with optional chaining + defaults
        const disabledReason = account.requirements?.disabled_reason ?? null;
        const currentlyDue = account.requirements?.currently_due ?? [];
        const pastDue = account.requirements?.past_due ?? [];

        const noDisabled = !disabledReason;
        const nothingDue = currentlyDue.length === 0 && pastDue.length === 0;

        // Optional: only use payouts_enabled if you actually need payouts right now
        const payoutsOk = !!account.payouts_enabled;

        // Your final readiness check (tweak to your flow)
        const isOnboarded = transfersActive && cardsActive && noDisabled && nothingDue;

        // Persist status
        const { error: updErr } = await supabase
            .from("users")
            .update({ status: isOnboarded ? "Onboarded" : "Pending" })
            .eq("userId", userId);

        if (updErr) throw updErr;

        return NextResponse.json({
            isOnboarded,
            flags: {
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
            },
            capabilities: account.capabilities,
            requirements: {
                disabled_reason: disabledReason,
                currently_due: currentlyDue,
                past_due: pastDue,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
    }
}