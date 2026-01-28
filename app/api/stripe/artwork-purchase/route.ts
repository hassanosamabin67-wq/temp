import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { artworkId, buyerId, amount, hostId, createdBy } = await req.json();

        if (!artworkId || !buyerId || !amount || !hostId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (buyerId === hostId || buyerId === createdBy) {
            return NextResponse.json({ error: "You cannot purchase your own artwork" }, { status: 400 });
        }

        const { data: artwork, error: artworkError } = await supabase
            .from('art_exhibit_room')
            .select('*')
            .eq('id', artworkId)
            .single();

        if (artworkError || !artwork) {
            return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
        }

        if (artwork.is_sold) {
            return NextResponse.json({ error: "Artwork is already sold" }, { status: 400 });
        }

        const { data: artistData, error: artistError } = await supabase
            .from('users')
            .select('stripe_account_id, userId')
            .eq('userId', hostId)
            .single();

        if (artistError || !artistData?.stripe_account_id) {
            return NextResponse.json({
                error: "Artist does not have a Stripe account connected. Please contact the artist to set up their payment account."
            }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            description: `Purchase: ${artwork.art_work_title}`,
            payment_method_types: ["card"],
            transfer_data: {
                destination: artistData.stripe_account_id,
                amount: Math.round(amount * 100),
            },
            metadata: {
                artworkId,
                buyerId,
                artistId: artistData.userId,
                type: 'artwork_purchase',
                artworkTitle: artwork.art_work_title
            }
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Artwork purchase error:', error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
} 