/**
 * Utility functions for ad management
 */

import { supabase } from '@/config/supabase';
import { Ad, AdImpression } from '@/types/adTypes';
import {
    REPLAY_AD_WINDOW_DAYS,
    REPLAY_IMPRESSION_CAP,
    LOBBY_DURATION_MIN,
    VIEW_TYPE
} from '@/utils/constants/adConstants';

/**
 * Fetch active lobby ads for a specific room/session
 * Lobby ads run during the last 30 minutes before session start
 */
export async function fetchLobbyAds(roomId: string, sessionId?: string): Promise<Ad[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_active_lobby_ads', {
                p_room_id: roomId,
                p_session_id: sessionId || null
            });

        if (error) {
            console.error('Error fetching lobby ads:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Fetch lobby ads error:', error);
        return [];
    }
}

/**
 * Fetch eligible replay ad for a specific room/session
 * Returns one random ad that meets criteria:
 * - Active status
 * - Less than 2000 impressions
 * - Within 30 days
 */
export async function fetchReplayAd(roomId: string, sessionId?: string): Promise<Ad | null> {
    try {
        const { data, error } = await supabase
            .rpc('get_eligible_replay_ads', {
                p_room_id: roomId,
                p_session_id: sessionId || null
            });

        if (error) {
            console.error('Error fetching replay ad:', error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error('Fetch replay ad error:', error);
        return null;
    }
}

/**
 * Record an ad impression
 */
export async function recordAdImpression(params: {
    adId: string;
    sessionId?: string;
    viewerId?: string;
    viewType: 'lobby' | 'replay';
    viewDuration?: number;
    completed?: boolean;
}): Promise<boolean> {
    try {
        const { adId, sessionId, viewerId, viewType, viewDuration, completed } = params;

        // Insert impression record
        const { error: impressionError } = await supabase
            .from('ad_impressions')
            .insert({
                ad_id: adId,
                session_id: sessionId,
                viewer_id: viewerId,
                view_type: viewType,
                view_duration: viewDuration,
                completed: completed ?? false,
                impression_date: new Date().toISOString()
            });

        if (impressionError) {
            console.error('Error recording impression:', impressionError);
            return false;
        }

        // Increment ad impression count using RPC function
        const { error: updateError } = await supabase
            .rpc('increment_ad_impression', {
                p_ad_id: adId,
                p_view_type: viewType
            });

        if (updateError) {
            console.error('Error updating impression count:', updateError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Record impression error:', error);
        return false;
    }
}

/**
 * Check if ads should be shown in lobby
 * Ads only show during last 30 minutes before session start
 */
export function shouldShowLobbyAds(sessionStartTime: string | Date): boolean {
    const now = new Date();
    const startTime = new Date(sessionStartTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);

    return minutesUntilStart <= LOBBY_DURATION_MIN && minutesUntilStart > 0;
}

/**
 * Get ad slot availability for a room/session
 */
export async function getAdSlotAvailability(
    roomId: string,
    sessionId?: string
): Promise<{ available: boolean; slotsRemaining: number; totalSlots: number }> {
    try {
        const { data, error } = await supabase
            .rpc('check_ad_slot_availability', {
                p_room_id: roomId,
                p_session_id: sessionId || null
            });

        if (error) {
            console.error('Error checking slot availability:', error);
            return { available: false, slotsRemaining: 0, totalSlots: 10 };
        }

        const slotsRemaining = data?.[0]?.slots_available ?? 0;
        return {
            available: slotsRemaining > 0,
            slotsRemaining,
            totalSlots: 10
        };
    } catch (error) {
        console.error('Get slot availability error:', error);
        return { available: false, slotsRemaining: 0, totalSlots: 10 };
    }
}

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        errors.push('Video must be MP4 or MOV format');
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        errors.push('Video file size must not exceed 50MB');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get video duration from file
 */
export async function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(Math.floor(video.duration));
        };

        video.onerror = () => {
            reject(new Error('Failed to load video metadata'));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Format impression count for display
 */
export function formatImpressionCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}

/**
 * Calculate ad performance metrics
 */
export function calculateAdMetrics(ad: Ad) {
    const remainingImpressions = Math.max(0, REPLAY_IMPRESSION_CAP - ad.impressions_count);
    const impressionPercentage = (ad.impressions_count / REPLAY_IMPRESSION_CAP) * 100;

    const createdDate = new Date(ad.created_at);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, REPLAY_AD_WINDOW_DAYS - daysSinceCreated);

    const isExpiringSoon = remainingDays <= 3 || remainingImpressions <= 100;

    return {
        remainingImpressions,
        impressionPercentage: Math.min(100, impressionPercentage),
        daysSinceCreated,
        remainingDays,
        isExpiringSoon,
        isExpired: ad.status === 'expired' || remainingImpressions === 0 || remainingDays === 0
    };
}

/**
 * Fetch user's ad statistics
 */
export async function fetchUserAdStats(userId: string) {
    try {
        const { data: ads, error } = await supabase
            .from('ads')
            .select(`
                id,
                status,
                impressions_count,
                purchase:ad_purchases(amount, payment_status)
            `)
            .eq('advertiser_id', userId);

        if (error) {
            console.error('Error fetching user ad stats:', error);
            return null;
        }

        const totalAds = ads?.length || 0;
        const activeAds = ads?.filter(ad => ad.status === 'active').length || 0;
        const pendingAds = ads?.filter(ad => ad.status === 'pending').length || 0;
        const totalImpressions = ads?.reduce((sum, ad) => sum + (ad.impressions_count || 0), 0) || 0;
        const totalSpent = ads?.reduce((sum, ad) => {
            const purchase = ad.purchase?.[0];
            return sum + (purchase?.payment_status === 'succeeded' ? purchase.amount : 0);
        }, 0) || 0;

        return {
            totalAds,
            activeAds,
            pendingAds,
            totalImpressions,
            totalSpent
        };
    } catch (error) {
        console.error('Fetch user ad stats error:', error);
        return null;
    }
}

/**
 * Fetch user's rooms for ad upload
 */
export async function fetchUserRoomsForAds(userId: string) {
    try {
        const { data: rooms, error } = await supabase
            .from('thinktank')
            .select(`
                id,
                title,
                sessions:think_tank_events(
                    id,
                    event_name,
                    event_date,
                    event_start_time,
                    status
                )
            `)
            .eq('host', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user rooms:', error);
            return [];
        }

        return rooms || [];
    } catch (error) {
        console.error('Fetch user rooms error:', error);
        return [];
    }
}

/**
 * Fetch ad impressions data over the last 30 days for a specific user
 * Returns daily aggregated impression counts
 */
export async function fetchAdImpressionsOverTime(userId: string): Promise<{
    date: string;
    impressions: number;
}[]> {
    try {
        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        // First, get all ad IDs for this user
        const { data: userAds, error: adsError } = await supabase
            .from('ads')
            .select('id')
            .eq('advertiser_id', userId);

        if (adsError) {
            console.error('Error fetching user ads:', adsError);
            return generateEmptyDailyData();
        }

        if (!userAds || userAds.length === 0) {
            return generateEmptyDailyData();
        }

        const adIds = userAds.map(ad => ad.id);

        // Fetch impressions for these ads over the last 30 days
        const { data: impressions, error: impressionsError } = await supabase
            .from('ad_impressions')
            .select('impression_date')
            .in('ad_id', adIds)
            .gte('impression_date', startDate)
            .order('impression_date', { ascending: true });

        if (impressionsError) {
            console.error('Error fetching impressions:', impressionsError);
            return generateEmptyDailyData();
        }

        // Group impressions by date
        const dailyImpressions: Record<string, number> = {};
        
        // Initialize all 30 days with 0
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toISOString().split('T')[0];
            dailyImpressions[dateStr] = 0;
        }

        // Count impressions per day
        impressions?.forEach(impression => {
            const date = impression.impression_date.split('T')[0];
            if (dailyImpressions.hasOwnProperty(date)) {
                dailyImpressions[date]++;
            }
        });

        // Convert to array format for chart
        return Object.entries(dailyImpressions)
            .map(([date, impressions]) => ({
                date,
                impressions
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    } catch (error) {
        console.error('Fetch ad impressions over time error:', error);
        return generateEmptyDailyData();
    }
}

/**
 * Generate empty daily data for the last 30 days
 * Used when there's no impression data
 */
function generateEmptyDailyData(): { date: string; impressions: number }[] {
    const data: { date: string; impressions: number }[] = [];
    
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        data.push({
            date: date.toISOString().split('T')[0],
            impressions: 0
        });
    }
    
    return data;
}