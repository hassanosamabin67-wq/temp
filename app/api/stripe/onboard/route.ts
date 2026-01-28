import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

        const { data: user, error } = await supabase
            .from("users")
            .select("stripe_account_id, email, stripe_customer_id")
            .eq("userId", userId)
            .single();

        if (error || !user) {
            console.error("User fetch error:", error);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let accountId = user.stripe_account_id;
        let customerId = user.stripe_customer_id;

        if (!accountId || !customerId) {
            const account = await stripe.accounts.create({
                type: "express",
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                }
            });

            const customer = await stripe.customers.create({
                email: user.email,
            });

            accountId = account.id;
            customerId = customer.id;

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    stripe_account_id: account.id,
                    stripe_customer_id: customer.id
                })
                .eq("userId", userId);

            if (updateError) {
                console.error("Stripe account save error:", updateError);
                return NextResponse.json({ error: "Failed to save Stripe account" }, { status: 500 });
            }
        }

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${req.headers.get('origin')}/onboarding/refresh`,
            return_url: `${req.headers.get('origin')}/onboarding/complete`,
            type: 'account_onboarding',
        });

        return new Response(JSON.stringify({ url: accountLink.url }), { status: 200 });
    } catch (err: any) {
        console.error("Stripe onboarding error:", err.message || err);
        return NextResponse.json({ error: `Internal server error ${err}` }, { status: 500 });
    }
}