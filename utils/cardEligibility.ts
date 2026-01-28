import { supabase } from '@/config/supabase';

export interface CardEligibilityStatus {
    currentEarnings: number;
    isEligibleForFreeCard: boolean;
    hasActiveCard: boolean;
    cardEligible: boolean;
    remainingAmount: number;
}

/**
 * Check if a user is eligible for a free Collab Card
 */
export async function checkCardEligibility(userId: string): Promise<CardEligibilityStatus | null> {
    try {
        // Get user's current earnings
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('earning, has_collab_card, card_eligible')
            .eq('userId', userId)
            .single();

        if (userError || !user) {
            console.error('Error fetching user data:', userError);
            return null;
        }

        // Check if user already has an active card
        const { data: activeCard } = await supabase
            .from('collab_cards')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        const currentEarnings = user.earning || 0;
        const isEligibleForFreeCard = currentEarnings >= 500;
        const hasActiveCard = !!activeCard;
        const remainingAmount = Math.max(0, 500 - currentEarnings);

        // Update card eligibility status in database
        await supabase
            .from('users')
            .update({ 
                card_eligible: isEligibleForFreeCard,
                has_collab_card: hasActiveCard
            })
            .eq('userId', userId);

        return {
            currentEarnings,
            isEligibleForFreeCard,
            hasActiveCard,
            cardEligible: user.card_eligible || false,
            remainingAmount
        };
    } catch (error) {
        console.error('Error checking card eligibility:', error);
        return null;
    }
}

/**
 * Update user earnings and check for card eligibility
 */
export async function updateUserEarnings(userId: string, newEarning: number): Promise<boolean> {
    try {
        // Update user earnings
        const { error: updateError } = await supabase
            .from('users')
            .update({ earning: newEarning })
            .eq('userId', userId);

        if (updateError) {
            console.error('Error updating user earnings:', updateError);
            return false;
        }

        // Check if user now qualifies for a free card
        const eligibility = await checkCardEligibility(userId);
        
        if (eligibility && eligibility.isEligibleForFreeCard && !eligibility.hasActiveCard) {
            // User just became eligible for a free card
            console.log(`User ${userId} is now eligible for a free Collab Card!`);
            
            // Import and trigger the invitation system
            const { checkAndTriggerCollabCardInvitation } = await import('@/utils/trigger_colab_card');
            await checkAndTriggerCollabCardInvitation(userId, newEarning);
        }

        return true;
    } catch (error) {
        console.error('Error updating user earnings:', error);
        return false;
    }
}

/**
 * Get card eligibility status for display
 */
export async function getCardStatus(userId: string): Promise<CardEligibilityStatus | null> {
    return await checkCardEligibility(userId);
}

/**
 * Check if user can create a card (either free or paid)
 */
export async function canCreateCard(userId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    cardType?: 'earn_it' | 'purchased';
}> {
    try {
        const eligibility = await checkCardEligibility(userId);
        
        if (!eligibility) {
            return { canCreate: false, reason: 'Unable to check eligibility' };
        }

        if (eligibility.hasActiveCard) {
            return { canCreate: false, reason: 'User already has an active card' };
        }

        if (eligibility.isEligibleForFreeCard) {
            return { canCreate: true, cardType: 'earn_it' };
        }

        // User can always purchase a card
        return { canCreate: true, cardType: 'purchased' };
    } catch (error) {
        console.error('Error checking if user can create card:', error);
        return { canCreate: false, reason: 'Error checking eligibility' };
    }
} 