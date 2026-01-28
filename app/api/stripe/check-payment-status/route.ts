import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const paymentIntentId = searchParams.get('paymentIntentId');

        if (!paymentIntentId) {
            return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return NextResponse.json({
            success: true,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            description: paymentIntent.description
        });

    } catch (err: any) {
        console.error('Error checking payment status:', err);
        return NextResponse.json({ 
            error: `Failed to check payment status: ${err.message}` 
        }, { status: 500 });
    }
} 