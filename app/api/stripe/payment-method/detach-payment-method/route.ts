import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { paymentMethodId } = await req.json();
        if (!paymentMethodId) return NextResponse.json({ error: 'Missing paymentMethodId' }, { status: 400 });

        await stripe.paymentMethods.detach(paymentMethodId);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}