import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get all ads for admin dashboard with filtering
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const admin_id = searchParams.get('admin_id');
        const status = searchParams.get('status');
        const searchTerm = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        if (!admin_id) {
            return NextResponse.json(
                { success: false, error: 'Admin ID required' },
                { status: 400 }
            );
        }

        // Verify admin role
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('user_role')
            .eq('userId', admin_id)
            .single();

        if (adminError || adminData?.user_role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // Build query
        let query = supabase
            .from('ads')
            .select(`
                *,
                advertiser:users!ads_advertiser_id_fkey(userId, email, firstName, lastName, profileImage),
                room:thinktank!ads_room_id_fkey(id, title, host),
                session:think_tank_events!ads_session_id_fkey(id, event_name, event_date),
                purchase:ad_purchases(id, payment_status, amount, paid_at)
            `, { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        // Order by created date
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching ads:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch ads' },
                { status: 500 }
            );
        }

        // Get statistics
        const { data: statsData } = await supabase
            .from('ads')
            .select('status, impressions_count');

        const statistics = {
            totalAds: count || 0,
            pendingAds: statsData?.filter(ad => ad.status === 'pending').length || 0,
            activeAds: statsData?.filter(ad => ad.status === 'active').length || 0,
            rejectedAds: statsData?.filter(ad => ad.status === 'rejected').length || 0,
            expiredAds: statsData?.filter(ad => ad.status === 'expired').length || 0,
            totalImpressions: statsData?.reduce((sum, ad) => sum + (ad.impressions_count || 0), 0) || 0
        };

        return NextResponse.json({
            success: true,
            ads: data,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
            statistics
        });

    } catch (error: any) {
        console.error('Get admin ads error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}