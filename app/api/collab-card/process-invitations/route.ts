import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { sendCollabCardInvitation } from '@/utils/trigger_colab_card';

export async function POST(req: NextRequest) {
    try {
        // Get pending invitations that haven't had emails sent yet
        const { data: pendingInvitations, error: fetchError } = await supabase
            .from('collab_card_invitations')
            .select(`
                id,
                user_id,
                earnings_at_invitation,
                users!inner(
                    email,
                    firstName,
                    lastName,
                    userName
                )
            `)
            .eq('status', 'sent')
            .eq('email_sent', false)
            .limit(50); // Process in batches

        if (fetchError) {
            console.error('Error fetching pending invitations:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch pending invitations' }, { status: 500 });
        }

        if (!pendingInvitations || pendingInvitations.length === 0) {
            return NextResponse.json({ 
                message: 'No pending invitations to process',
                processed: 0 
            });
        }

        let processedCount = 0;
        let successCount = 0;
        let failureCount = 0;

        // Process each invitation
        for (const invitation of pendingInvitations) {
            try {
                processedCount++;
                
                const user = invitation.users[0];
                const emailSent = await sendCollabCardInvitation(
                    invitation.user_id,
                    invitation.earnings_at_invitation
                );

                if (emailSent) {
                    // Update invitation as email sent
                    await supabase
                        .from('collab_card_invitations')
                        .update({ email_sent: true })
                        .eq('id', invitation.id);
                    
                    successCount++;
                    console.log(`Email sent successfully to ${user.email} for invitation ${invitation.id}`);
                } else {
                    // Mark as failed
                    await supabase
                        .from('collab_card_invitations')
                        .update({ 
                            email_sent: false, 
                            status: 'failed' 
                        })
                        .eq('id', invitation.id);
                    
                    failureCount++;
                    console.error(`Failed to send email to ${user.email} for invitation ${invitation.id}`);
                }

                // Add small delay to avoid overwhelming email service
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                failureCount++;
                console.error(`Error processing invitation ${invitation.id}:`, error);
                
                // Mark as failed
                await supabase
                    .from('collab_card_invitations')
                    .update({ 
                        email_sent: false, 
                        status: 'failed' 
                    })
                    .eq('id', invitation.id);
            }
        }

        // Log the processing results
        await supabase
            .from('platform_logs')
            .insert({
                action: 'Collab Card Invitations Processed',
                target: 'system',
                details: `Processed ${processedCount} invitations: ${successCount} successful, ${failureCount} failed`,
                action_type: 'collab_card',
                severity: 'info'
            });

        return NextResponse.json({
            message: 'Invitations processed successfully',
            processed: processedCount,
            successful: successCount,
            failed: failureCount
        });

    } catch (error) {
        console.error('Error processing invitations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get invitation statistics
        const { data: stats, error: statsError } = await supabase
            .from('collab_card_invitation_stats')
            .select('*')
            .single();

        if (statsError) {
            console.error('Error fetching invitation stats:', statsError);
            return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
        }

        // Get recent invitations
        const { data: recentInvitations, error: recentError } = await supabase
            .from('collab_card_invitations')
            .select(`
                id,
                user_id,
                earnings_at_invitation,
                invitation_date,
                status,
                email_sent,
                users!inner(
                    email,
                    firstName,
                    lastName,
                    userName
                )
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (recentError) {
            console.error('Error fetching recent invitations:', recentError);
            return NextResponse.json({ error: 'Failed to fetch recent invitations' }, { status: 500 });
        }

        return NextResponse.json({
            statistics: stats,
            recentInvitations: recentInvitations || []
        });

    } catch (error) {
        console.error('Error fetching invitation data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 