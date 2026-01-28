import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useSearchParams } from 'next/navigation';
import { ProfileWithOwnership } from '@/types/userInterface';

interface ServicesData {
    services: any[];
    totalServices: number;
}

interface ProfileData {
    profile: ProfileWithOwnership;
    stats: {
        totalStats: {
            views: number;
            impressions: number;
            clicks: number;
        };
        monthlyStats: {
            views: number;
            impressions: number;
            clicks: number;
        };
        completionPercentage: number;
    } | null;
    testimonials: {
        id: string;
        clientName: string;
        rating: number;
        reviewMessage: string;
        date: string;
    }[];
    workHistory: {
        id: string;
        title: string;
        review: number;
        review_message: string;
        start_datetime: string;
        end_datetime: string;
    }[];
    services: ServicesData;
    collabsCompleted: number;
}

function useFetchProfileData() {
    const searchParam = useSearchParams();
    const visionary: string | null = searchParam.get('visionary');
    const profileRedux = useAppSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ProfileData | null>(null);

    const fetchProfile = async (): Promise<ProfileWithOwnership | null> => {
        if (!visionary) {
            return {
                ...profileRedux,
                isOwnProfile: true,
                isClient: profileRedux.profileType === 'client'
            }
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('userId', visionary)
            .single();

        if (error) {
            console.error('Error fetching visionary profile:', error);
            return null;
        }

        return {
            ...data,
            isOwnProfile: false,
        }
    };

    const fetchStats = async (profile: any) => {
        const profileId = profile?.profileId;
        if (!profileId) return null;

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const { data: allStats, error: allStatsError } = await supabase
            .from('profile_stats')
            .select('views, impressions, clicks')
            .eq('user_id', profileId);

        const { data: monthlyStats, error: monthlyStatsError } = await supabase
            .from('profile_stats')
            .select('views, impressions, clicks, created_at')
            .eq('user_id', profileId)
            .gte('created_at', currentMonthStart.toISOString())
            .lte('created_at', currentMonthEnd.toISOString());

        if (allStatsError || monthlyStatsError) {
            console.error('Error fetching stats:', allStatsError || monthlyStatsError);
            return null;
        }

        const totals = allStats?.reduce(
            (acc, row) => ({
                views: acc.views + (row.views || 0),
                impressions: acc.impressions + (row.impressions || 0),
                clicks: acc.clicks + (row.clicks || 0),
            }),
            { views: 0, impressions: 0, clicks: 0 }
        ) || { views: 0, impressions: 0, clicks: 0 };

        const monthlyTotals = monthlyStats?.reduce(
            (acc, row) => ({
                views: acc.views + (row.views || 0),
                impressions: acc.impressions + (row.impressions || 0),
                clicks: acc.clicks + (row.clicks || 0),
            }),
            { views: 0, impressions: 0, clicks: 0 }
        ) || { views: 0, impressions: 0, clicks: 0 };

        const completedSections = [
            (profile?.certifications?.length ?? 0) > 0,
            (profile?.experience?.length ?? 0) > 0,
            (profile?.overview?.trim().length ?? 0) > 0,
            (profile?.workshops?.length ?? 0) > 0,
        ].filter(Boolean).length;

        const completionPercentage = (completedSections / 4) * 100;

        return {
            totalStats: totals,
            monthlyStats: monthlyTotals,
            completionPercentage,
        };
    };

    const getProfileTestimonials = async (profile: any) => {
        const profileId = profile?.profileId;
        if (!profileId) return [];

        try {
            const { data: orderData, error: orderError } = await supabase
                .from('order')
                .select('id, client_id, review_message, review, created_at')
                .eq('visionary_id', profileId)
                .eq('status', 'Approved');

            const { data: serviceOrders, error: serviceError } = await supabase
                .from('service_orders')
                .select('id, client_id, review_message, review, created_at')
                .eq('visionary_id', profileId)
                .eq('status', 'Approved');

            if (orderError || serviceError) {
                console.error('Error fetching testimonials:', orderError || serviceError);
                return [];
            }

            const allTestimonials = [...(orderData || []), ...(serviceOrders || [])].filter((t) => Number(t.review) > 4);
            const clientIds = [...new Set(allTestimonials.map((t) => t.client_id))];

            if (clientIds.length === 0) return [];

            const { data: clients, error: clientError } = await supabase
                .from('users')
                .select('userId, firstName, lastName')
                .in('userId', clientIds);

            if (clientError) {
                console.error('Error fetching client names:', clientError);
                return [];
            }

            return allTestimonials.map((t) => {
                const client = clients?.find((c) => c.userId === t.client_id);
                return {
                    id: t.id,
                    clientName: client ? `${client.firstName} ${client.lastName}` : 'Anonymous',
                    rating: t.review,
                    reviewMessage: t.review_message,
                    date: t.created_at,
                };
            });
        } catch (err) {
            console.error('Unexpected error fetching testimonials:', err);
            return [];
        }
    };

    const handleFetchWorkHistory = async (profile: any) => {
        try {
            const profileId = profile?.profileId;
            if (!profileId) return [];

            const { data, error } = await supabase
                .from('order')
                .select('id, title, start_datetime, end_datetime, review, review_message')
                .eq('visionary_id', profileId)
                .eq('status', 'Approved');

            if (error) {
                console.error('Error fetching work history:', error);
                return [];
            }

            return data?.sort(
                (a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
            ) || [];
        } catch (error) {
            console.error('Unexpected Error:', error);
            return [];
        }
    };

    const fetchServices = async (profile: ProfileWithOwnership) => {
        try {
            const profileId = profile?.profileId;
            if (!profileId) return { services: [], totalServices: 0 };

            let query = supabase
                .from("service")
                .select("*")
                .eq("profileId", profileId);

            if (!profile.isOwnProfile) {
                query = query.eq("visibility", "PUBLIC");
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching services: ", error)
                return { services: [], totalServices: 0 };
            } else {
                const servicesWithRatings = (data || []).map(service => {
                    const reviews = service.reviews || [];
                    const avg = reviews.length > 0 ? (reviews.reduce((sum: any, r: any) => sum + r, 0) / reviews.length).toFixed(1) : "0.0";
                    return {
                        ...service,
                        averageRating: parseFloat(avg),
                    };
                });
                return {
                    services: servicesWithRatings,
                    totalServices: servicesWithRatings.length
                }
            }
        } catch (err) {
            console.error("Unexpected error fetching services:", err);
            return { services: [], totalServices: 0 };
        }
    };

    const getCollabData = async (profile: ProfileWithOwnership) => {
        try {
            const profileId = profile?.profileId;
            if (!profileId) return 0;

            const { data, error } = await supabase
                .from('think_tank_participants')
                .select('*')
                .eq('participant_id', profileId)
                .eq('status', 'Accepted');

            if (error) {
                console.error('Error fetching Collab room data:', error);
                return 0;
            }

            return data.length || 0

        } catch (error) {
            console.error("Unexpeced error: ", error)
            return 0
        }
    }

    const handleFetchAllData = async () => {
        setLoading(true);

        try {
            const profile = await fetchProfile();
            if (!profile) throw new Error("Profile not found");

            const [stats, testimonials, workHistory, services, collabsCompleted] = await Promise.all([
                fetchStats(profile),
                getProfileTestimonials(profile),
                handleFetchWorkHistory(profile),
                fetchServices(profile),
                getCollabData(profile)
            ]);

            setData({
                profile,
                stats,
                testimonials,
                workHistory,
                services,
                collabsCompleted
            });
        } catch (err) {
            console.error('Error fetching profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleFetchAllData();
    }, [profileRedux]);

    return {
        ...data,
        loading,
    };
}

export default useFetchProfileData;