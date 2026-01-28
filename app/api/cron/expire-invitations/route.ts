import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function POST(req: NextRequest) {
    try {
        // Verify cron job secret if provided
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Call the database function to expire old invitations
        const { data, error } = await supabase.rpc('expire_old_collab_card_invitations');

        if (error) {
            console.error('Error expiring invitations:', error);
            return NextResponse.json({ error: 'Failed to expire invitations' }, { status: 500 });
        }

        const expiredCount = data || 0;

        console.log(`Expired ${expiredCount} old Collab Card invitations`);

        return NextResponse.json({
            message: 'Invitations expired successfully',
            expiredCount: expiredCount
        });

    } catch (error) {
        console.error('Error in expire invitations cron job:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get statistics about invitations that will expire soon
        const { data: expiringSoon, error: expiringError } = await supabase
            .from('collab_card_invitations')
            .select('id, user_id, invitation_date, users!inner(email, firstName, lastName)')
            .eq('status', 'sent')
            .lt('invitation_date', new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()) // 25 days old
            .gte('invitation_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 days old

        if (expiringError) {
            console.error('Error fetching expiring invitations:', expiringError);
            return NextResponse.json({ error: 'Failed to fetch expiring invitations' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Expiring invitations check completed',
            expiringSoon: expiringSoon || [],
            count: expiringSoon?.length || 0
        });

    } catch (error) {
        console.error('Error checking expiring invitations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 