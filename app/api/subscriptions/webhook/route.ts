import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature || !webhookSecret) {
            return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        console.log('Received webhook event:', event.type);

        switch (event.type) {
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
    try {
        const subscriptionId = invoice.subscription;
        const paymentIntentId = invoice.payment_intent;
        const amountPaid = invoice.amount_paid / 100; // Convert from cents
        const platformFee = Math.round(amountPaid * 0.20 * 100) / 100; // 20% platform fee
        const hostPayout = amountPaid - platformFee;

        console.log(`Processing invoice payment for subscription: ${subscriptionId}`);

        // Get subscription details from database
        const { data: subscription, error: subError } = await supabase
            .from("room_subscriptions")
            .select("*")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

        if (subError || !subscription) {
            console.error("Subscription not found in database:", subscriptionId, subError);

            // This shouldn't happen with the new flow, but log it
            console.error("Invoice payment succeeded but no database record found. This indicates a problem with subscription creation.");
            return;
        }

        console.log(`Found subscription in database: ${subscription.id}`);

        // Update subscription status to active
        const { error: updateError } = await supabase
            .from("room_subscriptions")
            .update({
                status: 'active',
                current_period_start: new Date(invoice.period_start * 1000).toISOString(),
                current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
            console.error("Error updating subscription status:", updateError);
        } else {
            console.log(`Updated subscription ${subscriptionId} to active status`);
        }

        // Record transaction
        const { error: txnError } = await supabase
            .from("subscription_transactions")
            .insert({
                subscription_id: subscription.id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: paymentIntentId,
                amount: amountPaid,
                platform_fee: platformFee,
                host_payout: hostPayout,
                status: 'paid',
                billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
                billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
                paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
            });

        if (txnError) {
            console.error("Error recording transaction:", txnError);
        } else {
            console.log(`Recorded transaction for invoice: ${invoice.id}`);
        }

        // Update analytics
        await updateSubscriptionAnalytics(subscription.room_id, subscription.host_id);

        // Grant room access (add to participants if not already there)
        const { data: existingParticipant } = await supabase
            .from("think_tank_participants")
            .select("id")
            .eq("think_tank_id", subscription.room_id)
            .eq("participant_id", subscription.subscriber_id)
            .single();

        if (!existingParticipant) {
            const { error: participantError } = await supabase
                .from("think_tank_participants")
                .insert({
                    think_tank_id: subscription.room_id,
                    participant_id: subscription.subscriber_id,
                    status: 'Accepted',
                    payment: 'Subscription',
                    is_agreement_accepted: true,
                });

            if (participantError) {
                console.error("Error adding participant:", participantError);
            } else {
                console.log(`Granted room access to subscriber: ${subscription.subscriber_id}`);
            }
        } else {
            console.log(`Subscriber ${subscription.subscriber_id} already has room access`);
        }

        console.log(`✅ Successfully processed payment for subscription: ${subscriptionId}`);

    } catch (error) {
        console.error("Error handling invoice payment succeeded:", error);
    }
}

async function handleInvoicePaymentFailed(invoice: any) {
    try {
        const subscriptionId = invoice.subscription;

        // Check if subscription record exists in database
        const { data: subscription, error: subError } = await supabase
            .from("room_subscriptions")
            .select("*")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

        if (subError && subError.code === "PGRST116") {
            // Subscription record doesn't exist - this was a first payment failure
            // Cancel the Stripe subscription to clean up
            console.log(`First payment failed for subscription ${subscriptionId}, canceling Stripe subscription`);

            try {
                await stripe.subscriptions.cancel(subscriptionId);
                console.log(`Canceled Stripe subscription: ${subscriptionId}`);
            } catch (cancelError) {
                console.error(`Error canceling Stripe subscription ${subscriptionId}:`, cancelError);
            }
            return;
        }

        if (subError || !subscription) {
            console.error("Error checking subscription for failed payment:", subError);
            return;
        }

        // Update subscription status for existing subscription
        await supabase
            .from("room_subscriptions")
            .update({ status: 'past_due' })
            .eq("stripe_subscription_id", subscriptionId);

        // Record failed transaction
        await supabase
            .from("subscription_transactions")
            .insert({
                subscription_id: subscription.id,
                stripe_invoice_id: invoice.id,
                amount: invoice.amount_due / 100,
                platform_fee: Math.round(invoice.amount_due * 0.20) / 100,
                host_payout: (invoice.amount_due - Math.round(invoice.amount_due * 0.20)) / 100,
                status: 'failed',
                billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
                billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
            });

        console.log(`Payment failed for existing subscription: ${subscriptionId}`);

    } catch (error) {
        console.error("Error handling invoice payment failed:", error);
    }
}

async function handleSubscriptionUpdated(subscription: any) {
    try {
        const updateData: any = {
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        };

        if (subscription.canceled_at) {
            updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
        }

        await supabase
            .from("room_subscriptions")
            .update(updateData)
            .eq("stripe_subscription_id", subscription.id);

        console.log(`Subscription updated: ${subscription.id}`);

    } catch (error) {
        console.error("Error handling subscription updated:", error);
    }
}

async function handleSubscriptionDeleted(subscription: any) {
    try {
        // Update subscription status
        await supabase
            .from("room_subscriptions")
            .update({
                status: 'canceled',
                canceled_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

        // Remove room access
        const { data: subscriptionData } = await supabase
            .from("room_subscriptions")
            .select("room_id, subscriber_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

        if (subscriptionData) {
            await supabase
                .from("think_tank_participants")
                .delete()
                .eq("think_tank_id", subscriptionData.room_id)
                .eq("participant_id", subscriptionData.subscriber_id)
                .eq("payment", "Subscription");
        }

        console.log(`Subscription deleted: ${subscription.id}`);

    } catch (error) {
        console.error("Error handling subscription deleted:", error);
    }
}

async function handleSubscriptionCreated(subscription: any) {
    try {
        // This is mainly for logging, the subscription should already be created in our database
        console.log(`Subscription created: ${subscription.id}`);
    } catch (error) {
        console.error("Error handling subscription created:", error);
    }
}

async function updateSubscriptionAnalytics(roomId: string, hostId: string) {
    try {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        // Get current month's data
        const { data: analytics } = await supabase
            .from("subscription_analytics")
            .select("*")
            .eq("room_id", roomId)
            .eq("month_year", currentMonth)
            .single();

        // Get subscription stats for the room
        const { data: subscriptions } = await supabase
            .from("room_subscriptions")
            .select("subscription_price, status, created_at")
            .eq("room_id", roomId);

        if (!subscriptions) return;

        const totalSubscribers = subscriptions.filter(s => s.status === 'active').length;
        const newSubscribers = subscriptions.filter(s =>
            s.status === 'active' &&
            new Date(s.created_at).toISOString().slice(0, 7) === currentMonth
        ).length;

        const grossRevenue = subscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + (s.subscription_price || 0), 0);

        const platformFees = grossRevenue * 0.20;
        const hostPayout = grossRevenue - platformFees;

        const analyticsData = {
            room_id: roomId,
            host_id: hostId,
            month_year: currentMonth,
            total_subscribers: totalSubscribers,
            new_subscribers: newSubscribers,
            gross_revenue: grossRevenue,
            platform_fees: platformFees,
            host_payout: hostPayout,
        };

        if (analytics) {
            await supabase
                .from("subscription_analytics")
                .update(analyticsData)
                .eq("id", analytics.id);
        } else {
            await supabase
                .from("subscription_analytics")
                .insert(analyticsData);
        }

    } catch (error) {
        console.error("Error updating subscription analytics:", error);
    }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
    try {
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);

        // Check if this is a manual payment intent for a subscription
        const metadata = paymentIntent.metadata;
        if (!metadata.subscription_id || !metadata.roomId || !metadata.subscriberId) {
            console.log("Payment intent is not for a subscription, skipping");
            return;
        }

        const subscriptionId = metadata.subscription_id;
        const roomId = metadata.roomId;
        const subscriberId = metadata.subscriberId;
        const hostId = metadata.hostId;
        const amountPaid = paymentIntent.amount / 100; // Convert from cents
        const platformFee = Math.round(amountPaid * 0.20 * 100) / 100; // 20% platform fee
        const hostPayout = amountPaid - platformFee;

        // Check if subscription record already exists
        const { data: existingSubscription, error: subError } = await supabase
            .from("room_subscriptions")
            .select("*")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

        if (subError && subError.code !== "PGRST116") {
            console.error("Error checking existing subscription:", subError);
            return;
        }

        if (!existingSubscription) {
            // Create the subscription record
            const { data: newSubscription, error: createError } = await supabase
                .from("room_subscriptions")
                .insert({
                    room_id: roomId,
                    subscriber_id: subscriberId,
                    host_id: hostId,
                    stripe_subscription_id: subscriptionId,
                    stripe_customer_id: paymentIntent.customer,
                    subscription_price: amountPaid,
                    platform_fee: platformFee,
                    host_payout: hostPayout,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                })
                .select()
                .single();

            if (createError) {
                console.error("Error creating subscription record:", createError);
                return;
            }

            console.log(`Created subscription record for payment intent: ${paymentIntent.id}`);

            // Grant room access
            const { data: existingParticipant } = await supabase
                .from("think_tank_participants")
                .select("id")
                .eq("think_tank_id", roomId)
                .eq("participant_id", subscriberId)
                .single();

            if (!existingParticipant) {
                await supabase
                    .from("think_tank_participants")
                    .insert({
                        think_tank_id: roomId,
                        participant_id: subscriberId,
                        status: 'Accepted',
                        payment: 'Subscription',
                        is_agreement_accepted: true,
                    });
            }

            // Update analytics
            await updateSubscriptionAnalytics(roomId, hostId);
        } else {
            console.log(`Subscription record already exists for: ${subscriptionId}`);
        }

    } catch (error) {
        console.error("Error handling payment intent succeeded:", error);
    }
}
