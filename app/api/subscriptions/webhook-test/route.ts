import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook Test Endpoint
 * Use this to verify your webhook setup is working
 * 
 * Access at: /api/subscriptions/webhook-test
 * 
 * This endpoint helps debug:
 * - If the route is accessible
 * - If environment variables are configured
 * - If Supabase connection works
 */

export async function GET(request: NextRequest) {
    const checks = {
        endpoint: "✅ Webhook test endpoint is accessible",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        checks: {
            stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        partialKeys: {
            stripeSecretKey: process.env.STRIPE_SECRET_KEY 
                ? `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...` 
                : 'NOT SET',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET 
                ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 9)}...` 
                : 'NOT SET',
        },
        allChecksPass: !!(
            process.env.STRIPE_SECRET_KEY &&
            process.env.STRIPE_WEBHOOK_SECRET &&
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
    };

    return NextResponse.json(checks, { 
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        return NextResponse.json({
            received: true,
            message: "✅ POST request received successfully",
            timestamp: new Date().toISOString(),
            bodyKeys: Object.keys(body),
            headers: {
                contentType: request.headers.get('content-type'),
                userAgent: request.headers.get('user-agent'),
                hasStripeSignature: !!request.headers.get('stripe-signature'),
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to parse request",
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 400 });
    }
}

