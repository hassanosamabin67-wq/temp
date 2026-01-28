import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/config/supabase';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            
            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;
            
            case 'issuing.card.created':
                await handleCardCreated(event.data.object);
                break;
            
            case 'issuing.card.updated':
                await handleCardUpdated(event.data.object);
                break;
            
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('Webhook error:', err);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
    try {
        // Check if this is a Collab Card purchase
        if (paymentIntent.metadata?.purchase_type === 'collab_card') {
            const userId = paymentIntent.metadata.userId;
            
            if (!userId) {
                console.error('No userId in payment intent metadata');
                return;
            }

            // Check if user already has an active card
            const { data: existingCard } = await supabase
                .from('collab_cards')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single();

            if (existingCard) {
                console.log(`User ${userId} already has an active card, skipping creation`);
                return;
            }

            // Get user data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('stripe_customer_id, email, firstName, lastName')
                .eq('userId', userId)
                .single();

            if (userError || !user) {
                console.error('User not found for card creation:', userError);
                return;
            }

            // Create a safe name for Stripe (only alphanumeric characters and spaces)
            let safeName = `${user.firstName || ''} ${user.lastName || ''}`
                .replace(/[^a-zA-Z0-9\s]/g, '') // Only keep letters, numbers, and spaces
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

            // If name is still problematic, use email prefix
            if (!safeName || safeName.length < 2 || safeName.length > 50) {
                const emailPrefix = user.email.split('@')[0];
                safeName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            }

            // Ensure we have a proper first and last name
            if (!safeName.includes(' ')) {
                safeName = `${safeName} User`;
            }

            // Final safety check - if still invalid, use a generic name
            if (!safeName || safeName.length < 2) {
                safeName = "Card Holder";
            }

            console.log('Creating card with safe name:', safeName);

            // Step 1: Create the cardholder first
            const cardholder = await stripe.issuing.cardholders.create({
                name: safeName,
                email: user.email,
                status: 'active',
                type: 'individual',
                billing: {
                    address: {
                        line1: '123 Test St',
                        city: 'San Francisco',
                        state: 'CA',
                        country: 'US',
                        postal_code: '94111'
                    }
                }
            });

            // Step 2: Create the card with the cardholder ID
            const card = await stripe.issuing.cards.create({
                cardholder: cardholder.id,
                currency: 'usd',
                type: 'virtual',
                status: 'active'
            });

            // Save card information to database with 'purchased' type
            const { error: cardError } = await supabase
                .from('collab_cards')
                .insert([{
                    user_id: userId,
                    stripe_card_id: card.id,
                    card_type: 'purchased', // Mark as purchased since user paid $10
                    status: 'active',
                    last_four: card.last4,
                    brand: card.brand,
                    created_at: new Date().toISOString(),
                    expires_month: card.exp_month,
                    expires_year: card.exp_year,
                }]);

            if (cardError) {
                console.error('Failed to save card to database:', cardError);
                // Delete the Stripe card if database save fails
                await stripe.issuing.cards.update(card.id, { status: 'inactive' });
                return;
            }

            // Update user's card status
            await supabase
                .from('users')
                .update({ 
                    has_collab_card: true,
                    card_eligible: true 
                })
                .eq('userId', userId);

            console.log('Collab Card created successfully for user:', userId, 'Type: purchased');
        }
    } catch (err) {
        console.error('Error handling payment intent succeeded:', err);
    }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
    try {
        console.log('Payment failed for payment intent:', paymentIntent.id);
        // You might want to send a notification to the user here
    } catch (err) {
        console.error('Error handling payment intent failed:', err);
    }
}

async function handleCardCreated(card: any) {
    try {
        console.log('Card created:', card.id);
        // You might want to send a notification to the user here
    } catch (err) {
        console.error('Error handling card created:', err);
    }
}

async function handleCardUpdated(card: any) {
    try {
        console.log('Card updated:', card.id);
        // Update card status in database if needed
        const { error } = await supabase
            .from('collab_cards')
            .update({ 
                status: card.status,
                updated_at: new Date().toISOString()
            })
            .eq('stripe_card_id', card.id);

        if (error) {
            console.error('Failed to update card in database:', error);
        }
    } catch (err) {
        console.error('Error handling card updated:', err);
    }
} 