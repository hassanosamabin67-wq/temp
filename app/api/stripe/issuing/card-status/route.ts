import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // Get user data including earnings
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('earning, has_collab_card, card_eligible')
            .eq('userId', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get active card if exists
        const { data: activeCard } = await supabase
            .from('collab_cards')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        // Calculate eligibility
        const currentEarnings = user.earning || 0;
        const isEligibleForFreeCard = currentEarnings >= 500;
        const hasActiveCard = !!activeCard;

        return NextResponse.json({
            success: true,
            data: {
                currentEarnings,
                isEligibleForFreeCard,
                hasActiveCard,
                cardEligible: user.card_eligible || false,
                hasCollabCard: user.has_collab_card || false,
                activeCard: activeCard ? {
                    id: activeCard.id,
                    last_four: activeCard.last_four,
                    brand: activeCard.brand,
                    card_type: activeCard.card_type,
                    expires_month: activeCard.expires_month,
                    expires_year: activeCard.expires_year,
                    created_at: activeCard.created_at
                } : null
            }
        });

    } catch (err: any) {
        console.error('Card status check error:', err);
        return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
    }
} 