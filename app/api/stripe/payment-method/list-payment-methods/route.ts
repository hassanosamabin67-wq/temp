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

        const customerId = user.stripe_customer_id;

        const [methodsList, customer] = await Promise.all([
            stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
            stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>,
        ]);

        const defaultPm = (customer.invoice_settings?.default_payment_method as string) || null;

        return NextResponse.json({
            paymentMethods: methodsList.data,
            defaultPaymentMethod: defaultPm,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}