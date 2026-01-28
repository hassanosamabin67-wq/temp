import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    try {
        const { subscriptionId, cancelAtPeriodEnd = true } = await request.json();

        if (!subscriptionId) {
            return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
        }

        // Get subscription details from database
        const { data: subscription, error: subError } = await supabase
            .from("room_subscriptions")
            .select("*")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

        if (subError || !subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        let updatedSubscription;
        if (cancelAtPeriodEnd) {
            // Cancel at period end (user keeps access until end of billing cycle)
            updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true
            });
        } else {
            // Cancel immediately
            updatedSubscription = await stripe.subscriptions.cancel(subscriptionId);
        }

        // Update database record
        const updateData: any = {
            status: updatedSubscription.status,
            cancel_at_period_end: updatedSubscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
        };

        if (updatedSubscription.canceled_at) {
            updateData.canceled_at = new Date(updatedSubscription.canceled_at * 1000).toISOString();
        }

        const { error: updateError } = await supabase
            .from("room_subscriptions")
            .update(updateData)
            .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
            console.error("Database update error:", updateError);
            return NextResponse.json({ error: "Failed to update subscription record" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            status: updatedSubscription.status,
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            currentPeriodEnd: updatedSubscription.current_period_end
                ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
                : null,
            message: cancelAtPeriodEnd
                ? "Subscription will be canceled at the end of the current billing period"
                : "Subscription canceled immediately"
        });

    } catch (error) {
        console.error("Subscription cancellation error:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error}` },
            { status: 500 }
        );
    }
}
