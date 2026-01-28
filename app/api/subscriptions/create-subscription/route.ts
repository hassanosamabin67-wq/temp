import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    try {
        const { roomId, subscriberId, priceId } = await request.json();

        if (!roomId || !subscriberId || !priceId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get room and host details
        const { data: room, error: roomError } = await supabase
            .from("thinktank")
            .select("host, title, subscription_enabled, subscription_price")
            .eq("id", roomId)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        if (!room.subscription_enabled) {
            return NextResponse.json({ error: "Room is not subscription-enabled" }, { status: 400 });
        }

        // Check if user already has an active subscription to this room
        const { data: existingSubscription, error: subCheckError } = await supabase
            .from("room_subscriptions")
            .select("*")
            .eq("room_id", roomId)
            .eq("subscriber_id", subscriberId)
            .in("status", ["active", "trialing", "past_due"])
            .single();

        if (subCheckError && subCheckError.code !== "PGRST116") {
            console.error("Error checking existing subscription:", subCheckError);
            return NextResponse.json({ error: "Failed to check existing subscription" }, { status: 500 });
        }

        if (existingSubscription) {
            return NextResponse.json({
                error: "You already have an active subscription to this room",
                subscription: existingSubscription
            }, { status: 400 });
        }

        // Clean up any incomplete subscription records
        const { data: incompleteSubscriptions } = await supabase
            .from("room_subscriptions")
            .select("stripe_subscription_id")
            .eq("room_id", roomId)
            .eq("subscriber_id", subscriberId)
            .eq("status", "incomplete");

        if (incompleteSubscriptions && incompleteSubscriptions.length > 0) {
            for (const sub of incompleteSubscriptions) {
                try {
                    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
                } catch (cancelError) {
                    console.error(`Error canceling incomplete subscription:`, cancelError);
                }
            }

            await supabase
                .from("room_subscriptions")
                .delete()
                .eq("room_id", roomId)
                .eq("subscriber_id", subscriberId)
                .eq("status", "incomplete");
        }

        // Get host's Stripe account
        const { data: hostData, error: hostError } = await supabase
            .from("users")
            .select("stripe_account_id, firstName, lastName")
            .eq("userId", room.host)
            .single();

        if (hostError || !hostData?.stripe_account_id) {
            return NextResponse.json({ error: "Host Stripe account not found" }, { status: 400 });
        }

        // Get subscriber details
        const { data: subscriber, error: subscriberError } = await supabase
            .from("users")
            .select("stripe_customer_id, firstName, lastName, email")
            .eq("userId", subscriberId)
            .single();

        if (subscriberError || !subscriber) {
            return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
        }

        // Create or get Stripe customer
        let customerId = subscriber.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: subscriber.email,
                name: `${subscriber.firstName} ${subscriber.lastName}`,
                metadata: {
                    userId: subscriberId
                }
            });
            customerId = customer.id;

            await supabase
                .from("users")
                .update({ stripe_customer_id: customerId })
                .eq("userId", subscriberId);
        }

        // Create subscription and manually finalize the invoice to ensure payment intent creation
        try {
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                    payment_method_types: ['card']
                },
                expand: ['latest_invoice'],
                application_fee_percent: 20,
                transfer_data: {
                    destination: hostData.stripe_account_id,
                },
                metadata: {
                    roomId: roomId,
                    subscriberId: subscriberId,
                    hostId: room.host,
                    roomTitle: room.title
                }
            });

            console.log("Subscription created:", subscription.id);
            console.log("Subscription status:", subscription.status);

            // Get the invoice and finalize it to create payment intent
            let clientSecret = null;

            if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
                const invoice = subscription.latest_invoice;
                console.log("Invoice status:", invoice.status);
                console.log("Invoice auto_advance:", invoice.auto_advance);

                // If invoice is not finalized or doesn't have payment intent, finalize it
                if (invoice.status === 'draft') {
                    console.log("Finalizing draft invoice...");
                    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
                        auto_advance: true
                    });
                    console.log("Invoice finalized, status:", finalizedInvoice.status);

                    // Retrieve with payment intent expanded
                    const invoiceWithPI = await stripe.invoices.retrieve(finalizedInvoice.id, {
                        expand: ['payment_intent']
                    });

                    if (invoiceWithPI.payment_intent && typeof invoiceWithPI.payment_intent === 'object') {
                        clientSecret = invoiceWithPI.payment_intent.client_secret;
                    }
                } else if (invoice.status === 'open' && !invoice.payment_intent) {
                    console.log("Open invoice without payment intent, creating payment intent manually...");

                    // Create a payment intent manually for the invoice amount
                    const paymentIntent = await stripe.paymentIntents.create({
                        amount: invoice.amount_due,
                        currency: invoice.currency,
                        customer: customerId,
                        payment_method_types: ['card'],
                        setup_future_usage: 'off_session',
                        application_fee_amount: Math.round(invoice.amount_due * 0.20), // 20% platform fee
                        transfer_data: {
                            destination: hostData.stripe_account_id,
                        },
                        metadata: {
                            subscription_id: subscription.id,
                            invoice_id: invoice.id,
                            roomId: roomId,
                            subscriberId: subscriberId,
                            hostId: room.host,
                            roomTitle: room.title
                        }
                    });

                    clientSecret = paymentIntent.client_secret;
                    console.log("Created manual payment intent:", paymentIntent.id);
                } else {
                    // Invoice should have payment intent, retrieve it
                    const invoiceWithPI = await stripe.invoices.retrieve(invoice.id, {
                        expand: ['payment_intent']
                    });

                    if (invoiceWithPI.payment_intent && typeof invoiceWithPI.payment_intent === 'object') {
                        clientSecret = invoiceWithPI.payment_intent.client_secret;
                    } else if (invoiceWithPI.payment_intent) {
                        const paymentIntent = await stripe.paymentIntents.retrieve(invoiceWithPI.payment_intent);
                        clientSecret = paymentIntent.client_secret;
                    }
                }
            }

            if (!clientSecret) {
                console.error("Could not create or retrieve payment intent");

                // Cancel the subscription
                await stripe.subscriptions.cancel(subscription.id);

                return NextResponse.json({
                    error: "Failed to setup payment. Please try again.",
                }, { status: 500 });
            }

            console.log(`Successfully created subscription ${subscription.id} with payment intent`);

            return NextResponse.json({
                subscriptionId: subscription.id,
                clientSecret: clientSecret,
                status: subscription.status
            });

        } catch (stripeError: any) {
            console.error("Stripe subscription creation error:", stripeError);

            return NextResponse.json({
                error: stripeError.message || "Failed to create subscription",
                details: stripeError.code
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Subscription creation error:", error);

        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}