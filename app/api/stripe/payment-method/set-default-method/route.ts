import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/config/supabase';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { userId, paymentMethodId } = await req.json();
        if (!userId || !paymentMethodId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const { data: user, error } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('userId', userId)
            .single();

        if (error || !user?.stripe_customer_id) {
            return NextResponse.json({ error: 'No stripe_customer_id' }, { status: 404 });
        }

        await stripe.customers.update(user.stripe_customer_id, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}