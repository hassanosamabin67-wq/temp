import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const advertiser_id = searchParams.get('advertiser_id');
        const status = searchParams.get('status');

        if (!advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Advertiser ID required' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('ads')
            .select(`
                *,
                room:thinktank!ads_room_id_fkey(id, title, host),
                session:think_tank_events!ads_session_id_fkey(id, event_name, event_date)
            `)
            .eq('advertiser_id', advertiser_id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching ads:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch ads' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            ads: data,
            count: data.length
        });

    } catch (error: any) {
        console.error('Get ads error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}