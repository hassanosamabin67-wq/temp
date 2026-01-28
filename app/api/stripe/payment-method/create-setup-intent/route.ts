import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/config/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const { data: user, error } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('userId', userId)
            .single();

        if (error || !user?.stripe_customer_id) {
            return NextResponse.json({ error: 'No stripe_customer_id' }, { status: 404 });
        }

        const setupIntent = await stripe.setupIntents.create({
            customer: user.stripe_customer_id,
            payment_method_types: ['card'],
            usage: 'off_session',
        });

        return NextResponse.json({ clientSecret: setupIntent.client_secret });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}