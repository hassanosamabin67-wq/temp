import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { fileId, buyerId, amount, hostId } = await req.json();

        if (!fileId || !buyerId || !amount || !hostId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (buyerId === hostId) {
            return NextResponse.json({ error: "You cannot purchase your own files" }, { status: 400 });
        }

        // Get file details
        const { data: file, error: fileError } = await supabase
            .from('fitness_room_files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Get host's Stripe account
        const { data: hostData, error: hostError } = await supabase
            .from('users')
            .select('stripe_account_id, userId')
            .eq('userId', hostId)
            .single();

        if (hostError || !hostData?.stripe_account_id) {
            return NextResponse.json({
                error: "Host does not have a Stripe account connected. Please contact the host to set up their payment account."
            }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            description: `Purchase: ${file.name}`,
            payment_method_types: ["card"],
            transfer_data: {
                destination: hostData.stripe_account_id,
                amount: Math.round(amount * 100),
            },
            metadata: {
                fileId,
                buyerId,
                hostId: hostData.userId,
                type: 'fitness_file_purchase',
                fileName: file.name
            }
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Fitness file purchase error:', error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}