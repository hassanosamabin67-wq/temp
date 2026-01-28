import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    try {
        const { userId, cardType } = await req.json();

        if (!userId || !cardType) {
            return NextResponse.json({ error: "Missing userId or cardType" }, { status: 400 });
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('stripe_customer_id, email, firstName, lastName, earning')
            .eq('userId', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user already has a card
        const { data: existingCard } = await supabase
            .from('collab_cards')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (existingCard) {
            return NextResponse.json({ error: "User already has an active Collab Card" }, { status: 409 });
        }

        // Validate eligibility based on card type
        if (cardType === 'earn_it') {
            // Only check earning requirement for free cards
            if (!user.earning || user.earning < 500) {
                return NextResponse.json({ 
                    error: "Must earn at least $500 to qualify for free Collab Card",
                    currentEarnings: user.earning || 0,
                    requiredAmount: 500
                }, { status: 403 });
            }
        } else if (cardType === 'purchased') {
            // For purchased cards, no earning requirement - user already paid $10
            console.log(`Creating purchased card for user ${userId} - no earning requirement check needed`);
        } else {
            return NextResponse.json({ error: "Invalid card type" }, { status: 400 });
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

        // Save card information to database
        const { error: cardError } = await supabase
            .from('collab_cards')
            .insert([{
                user_id: userId,
                stripe_card_id: card.id,
                card_type: cardType,
                status: 'active',
                last_four: card.last4,
                brand: card.brand,
                created_at: new Date().toISOString(),
                expires_month: card.exp_month,
                expires_year: card.exp_year,
            }]);

        if (cardError) {
            // If database save fails, delete the Stripe card
            await stripe.issuing.cards.update(card.id, { status: 'inactive' });
            return NextResponse.json({ error: "Failed to save card information" }, { status: 500 });
        }

        // Update user's card eligibility status
        await supabase
            .from('users')
            .update({ 
                has_collab_card: true,
                card_eligible: true 
            })
            .eq('userId', userId);

        return NextResponse.json({ 
            success: true, 
            card: {
                id: card.id,
                last4: card.last4,
                brand: card.brand,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
                type: cardType
            }
        });

    } catch (err: any) {
        console.error('Stripe Issuing error:', err);
        return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
    }
} 