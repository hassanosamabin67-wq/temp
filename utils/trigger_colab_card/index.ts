import { supabase } from '@/config/supabase';

export async function updateEarnings(userId: string, newEarnings: number) {

  const { data, error } = await supabase
    .from('profiles')
    .update({ earnings: newEarnings })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Check if user has reached $500 threshold and send invitation if eligible
 */
export async function checkAndTriggerCollabCardInvitation(userId: string, newEarnings: number): Promise<boolean> {
  try {
    // Check if user already has an active card
    const { data: existingCard } = await supabase
      .from('collab_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingCard) {
      console.log(`User ${userId} already has an active Collab Card`);
      return false;
    }

    // Check if user has already been invited
    const { data: existingInvitation } = await supabase
      .from('collab_card_invitations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .single();

    if (existingInvitation) {
      console.log(`User ${userId} has already been invited for Collab Card`);
      return false;
    }

    // Check if earnings have reached $500 threshold
    if (newEarnings >= 500) {
      console.log(`User ${userId} has reached $500 threshold ($${newEarnings}), triggering invitation`);
      
      // Send invitation
      const invitationSent = await sendCollabCardInvitation(userId, newEarnings);
      
      if (invitationSent) {
        // Update user's card eligibility
        await supabase
          .from('users')
          .update({ card_eligible: true })
          .eq('userId', userId);
        
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking and triggering Collab Card invitation:', error);
    return false;
  }
}

/**
 * Send Collab Card invitation to user
 */
export async function sendCollabCardInvitation(userId: string, earnings: number): Promise<boolean> {
  try {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, firstName, lastName, userName')
      .eq('userId', userId)
      .single();

    if (userError || !user) {
      console.error('User not found for invitation:', userError);
      return false;
    }

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('collab_card_invitations')
      .insert({
        user_id: userId,
        earnings_at_invitation: earnings,
        invitation_date: new Date().toISOString(),
        status: 'sent',
        email_sent: true
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation record:', invitationError);
      return false;
    }

    // Send email invitation
    const emailSent = await sendCollabCardEmail(user.email, user.firstName, user.lastName, earnings);
    
    if (!emailSent) {
      // Update invitation status if email failed
      await supabase
        .from('collab_card_invitations')
        .update({ email_sent: false, status: 'failed' })
        .eq('id', invitation.id);
      
      return false;
    }

    // Log the invitation
    await logCollabCardInvitation(userId, earnings, invitation.id);

    console.log(`Collab Card invitation sent successfully to user ${userId}`);
    return true;

  } catch (error) {
    console.error('Error sending Collab Card invitation:', error);
    return false;
  }
}

/**
 * Send email invitation for Collab Card
 */
async function sendCollabCardEmail(email: string, firstName: string, lastName: string, earnings: number): Promise<boolean> {
  try {
    // You can integrate with your preferred email service here
    // For now, we'll use a placeholder that you can replace with your email service
    
    const emailContent = {
      to: email,
      subject: "🎉 Congratulations! You're Eligible for a Free Collab Card",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Congratulations, ${firstName}!</h2>
          
          <p>You've reached an exciting milestone! You've earned <strong>$${earnings.toFixed(2)}</strong> on our platform, which makes you eligible for a <strong>FREE Collab Card</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #27ae60; margin-top: 0;">What is a Collab Card?</h3>
            <p>The Collab Card is a virtual card that gives you instant access to your earnings. You can use it for:</p>
            <ul>
              <li>Online purchases</li>
              <li>ATM withdrawals</li>
              <li>Everyday spending</li>
              <li>Managing your creative income</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/collab-cards" 
               style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Get Your Free Collab Card
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 14px;">
            This invitation is valid for 30 days. Don't miss out on this exclusive benefit!
          </p>
          
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
          
          <p style="color: #7f8c8d; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `
    };

    // TODO: Replace this with your actual email service integration
    // Examples: SendGrid, AWS SES, Resend, etc.
    console.log('Email invitation content:', emailContent);
    
    // For now, we'll simulate successful email sending
    // In production, replace this with actual email service call
    return true;

  } catch (error) {
    console.error('Error sending email invitation:', error);
    return false;
  }
}

/**
 * Log Collab Card invitation for tracking
 */
async function logCollabCardInvitation(userId: string, earnings: number, invitationId: string): Promise<void> {
  try {
    await supabase
      .from('platform_logs')
      .insert({
        action: 'Collab Card Invitation Sent',
        target: userId,
        details: `User earned $${earnings.toFixed(2)} and was invited for free Collab Card. Invitation ID: ${invitationId}`,
        action_type: 'collab_card',
        severity: 'info'
      });
  } catch (error) {
    console.error('Error logging Collab Card invitation:', error);
  }
}

/**
 * Get invitation status for a user
 */
export async function getCollabCardInvitationStatus(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('collab_card_invitations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching invitation status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting invitation status:', error);
    return null;
  }
}

/**
 * Mark invitation as accepted
 */
export async function markInvitationAsAccepted(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('collab_card_invitations')
      .update({ 
        status: 'accepted',
        accepted_date: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) {
      console.error('Error marking invitation as accepted:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking invitation as accepted:', error);
    return false;
  }
}
