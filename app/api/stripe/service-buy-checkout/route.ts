import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { serviceProviderId, serviceTitle, amount, serviceId, orderData } = await req.json();

        if (!serviceProviderId || !serviceTitle || !amount || !serviceId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: serviceProviderData, error: serviceProviderError } = await supabase
            .from('users')
            .select('stripe_account_id, userId')
            .eq('userId', serviceProviderId)
            .single();

        if (serviceProviderError || !serviceProviderData?.stripe_account_id) {
            return NextResponse.json({
                error: "Service Provider does not have a Stripe account connected. Please contact the service provider to set up their payment account."
            }, { status: 400 });
        }

        const platformFee = Math.round(amount * 0.15 * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            description: `Service Purchase: ${serviceTitle}`,
            payment_method_types: ["card"],
            transfer_data: {
                destination: serviceProviderData.stripe_account_id,
            },
            application_fee_amount: platformFee,
            metadata: {
                serviceProviderId: serviceProviderData.userId,
                serviceId: serviceId,
                type: 'service_purchase',
                serviceTitle: serviceTitle,
                packageName: orderData?.packageName || 'Default Package',
                clientDescription: orderData?.description || '',
                deadline: orderData?.deadline || '',
                addOns: orderData?.selectedAddOns ? JSON.stringify(orderData.selectedAddOns) : ''
            }
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Service purchase error:', error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}