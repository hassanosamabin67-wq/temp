import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('stripe_customer_id, email, firstName, lastName')
            .eq('userId', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user already has a card
        const { data: existingCard } = await supabase
            .from('collab_cards')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (existingCard) {
            return NextResponse.json({ error: "User already has an active Collab Card" }, { status: 409 });
        }

        // Create payment intent for $10
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // $10.00 in cents
            currency: 'usd',
            customer: user.stripe_customer_id,
            description: 'Collab Card Purchase - $10',
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: userId,
                purchase_type: 'collab_card'
            }
        });

        return NextResponse.json({ 
            success: true, 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (err: any) {
        console.error('Buy card payment error:', err);
        return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
    }
} 