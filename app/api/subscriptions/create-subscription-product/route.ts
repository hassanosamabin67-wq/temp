import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    try {
        const { roomId, roomTitle, subscriptionPrice, hostId } = await request.json();

        if (!roomId || !roomTitle || !subscriptionPrice || !hostId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (subscriptionPrice < 5) {
            return NextResponse.json({ error: "Minimum subscription price is $5/month" }, { status: 400 });
        }

        // Check if host has Stripe account
        const { data: hostData, error: hostError } = await supabase
            .from("users")
            .select("stripe_account_id")
            .eq("userId", hostId)
            .single();

        if (hostError || !hostData?.stripe_account_id) {
            return NextResponse.json({ error: "Host must connect Stripe account first" }, { status: 400 });
        }

        // Create Stripe product
        const product = await stripe.products.create({
            name: `${roomTitle} - Monthly Subscription`,
            description: `Monthly subscription access to ${roomTitle} Collab Room`,
            metadata: {
                roomId: roomId,
                hostId: hostId,
                type: 'subscription_room'
            }
        });

        // Create Stripe price
        const price = await stripe.prices.create({
            unit_amount: Math.round(subscriptionPrice * 100), // Convert to cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            product: product.id,
            metadata: {
                roomId: roomId,
                hostId: hostId
            }
        });

        // Update room with subscription details
        const { error: roomUpdateError } = await supabase
            .from("thinktank")
            .update({
                subscription_enabled: true,
                subscription_price: subscriptionPrice,
                stripe_price_id: price.id,
                stripe_product_id: product.id
            })
            .eq("id", roomId);

        if (roomUpdateError) {
            console.error("Room update error:", roomUpdateError);
            // Clean up Stripe resources
            await stripe.products.del(product.id);
            return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
        }

        // Create subscription room record
        const { error: subscriptionRoomError } = await supabase
            .from("subscription_rooms")
            .upsert({
                room_id: roomId,
                host_id: hostId,
                subscription_price: subscriptionPrice,
                stripe_price_id: price.id,
                stripe_product_id: product.id,
                platform_fee_percentage: 20.00,
                is_active: true
            });

        if (subscriptionRoomError) {
            console.error("Subscription room creation error:", subscriptionRoomError);
            // Clean up Stripe resources and room update
            await stripe.products.del(product.id);
            await supabase
                .from("thinktank")
                .update({
                    subscription_enabled: false,
                    subscription_price: null,
                    stripe_price_id: null,
                    stripe_product_id: null
                })
                .eq("id", roomId);
            return NextResponse.json({ error: "Failed to create subscription room" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            productId: product.id,
            priceId: price.id,
            subscriptionPrice: subscriptionPrice,
            message: "Subscription room created successfully"
        });

    } catch (error) {
        console.error("Subscription product creation error:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error}` },
            { status: 500 }
        );
    }
}
