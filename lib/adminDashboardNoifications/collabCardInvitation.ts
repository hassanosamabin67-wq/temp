import { sendCollabCardInvitationEmail } from "@/utils/emailServices/adminDashbordEmailService/collabCardInvitation";
import { createNotification } from "../notificationService";
import { supabase } from "@/config/supabase";

export interface CollabCardInvitationResult {
    success: boolean;
    invitationId?: string;
    error?: string;
}

/**
 * Send a manual Collab Card invitation from admin dashboard
 * This creates an invitation record, sends notification, and sends email
 */
export async function sendManualCollabCardInvitation(
    adminUserId: string,
    targetUserId: string,
    targetUserEmail: string,
    targetUserFirstName: string,
    targetUserLastName: string,
    earnings?: number
): Promise<CollabCardInvitationResult> {
    try {
        // Check if user already has an active card
        const { data: existingCard } = await supabase
            .from('collab_cards')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('status', 'active')
            .single();

        if (existingCard) {
            return {
                success: false,
                error: 'User already has an active Collab Card'
            };
        }

        // Check if user has already been invited
        const { data: existingInvitation } = await supabase
            .from('collab_card_invitations')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('status', 'sent')
            .single();

        if (existingInvitation) {
            return {
                success: false,
                error: 'User has already been invited for Collab Card'
            };
        }

        // Create invitation record
        const { data: invitation, error: invitationError } = await supabase
            .from('collab_card_invitations')
            .insert({
                user_id: targetUserId,
                earnings_at_invitation: earnings || 0,
                invitation_date: new Date().toISOString(),
                status: 'sent',
                email_sent: true // We're sending email immediately
            })
            .select()
            .single();

        if (invitationError) {
            console.error('Error creating invitation record:', invitationError);
            return {
                success: false,
                error: 'Failed to create invitation record'
            };
        }

        // Update user's card eligibility
        await supabase
            .from('users')
            .update({ card_eligible: true })
            .eq('userId', targetUserId);

        // Create in-app notification
        const actionUrl = '/collab-cards';
        await createNotification({
            userId: adminUserId,
            receiverId: targetUserId,
            type: 'collab card',
            title: "🎉 You're Invited to Get a Free Collab Card!",
            message: "You've been personally invited to get your free Collab Card. Click to claim it now!",
            data: { actionUrl, invitationId: invitation.id },
            actionUrl: actionUrl,
            priority: 'high'
        });

        // Send email invitation
        await sendCollabCardInvitationEmail({
            receiverEmail: targetUserEmail,
            firstName: targetUserFirstName,
            lastName: targetUserLastName,
            earnings: earnings,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/collab-cards`
        });

        // Log the manual invitation
        await supabase
            .from('platform_logs')
            .insert({
                action: 'Manual Collab Card Invitation Sent',
                target: targetUserId,
                details: `Admin manually invited user ${targetUserFirstName} ${targetUserLastName} (${targetUserEmail}) for Collab Card. Invitation ID: ${invitation.id}`,
                action_type: 'collab_card',
                severity: 'info'
            });

        return {
            success: true,
            invitationId: invitation.id
        };

    } catch (error) {
        console.error('Error sending manual Collab Card invitation:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Get list of users eligible for Collab Card invitation
 * Users who:
 * 1. Don't have an active card
 * 2. Haven't been invited yet (with status 'sent')
 */
export async function getEligibleUsersForInvitation(): Promise<any[]> {
    try {
        // Get all users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('userId, firstName, lastName, email, userName, earning, has_collab_card, card_eligible')
            .eq('user_role', 'user')
            .order('earning', { ascending: false });

        if (usersError) {
            console.error('Error fetching users:', usersError);
            return [];
        }

        // Get users with active cards
        const { data: activeCards } = await supabase
            .from('collab_cards')
            .select('user_id')
            .eq('status', 'active');

        const usersWithCards = new Set((activeCards || []).map(c => c.user_id));

        // Get users with pending invitations
        const { data: pendingInvitations } = await supabase
            .from('collab_card_invitations')
            .select('user_id')
            .eq('status', 'sent');

        const usersWithInvitations = new Set((pendingInvitations || []).map(i => i.user_id));

        // Filter eligible users
        const eligibleUsers = (users || []).filter(user =>
            !usersWithCards.has(user.userId) && !usersWithInvitations.has(user.userId)
        );

        return eligibleUsers;

    } catch (error) {
        console.error('Error getting eligible users:', error);
        return [];
    }
}

/**
 * Get invitation statistics for admin dashboard
 */
export async function getCollabCardInvitationStats() {
    try {
        const { data: stats, error } = await supabase
            .from('collab_card_invitation_stats')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching invitation stats:', error);
            return null;
        }

        return stats;
    } catch (error) {
        console.error('Error getting invitation stats:', error);
        return null;
    }
}