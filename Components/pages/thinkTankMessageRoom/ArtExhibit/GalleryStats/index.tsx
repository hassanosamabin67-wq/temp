import React, { useEffect, useState } from 'react'
import styles from './style.module.css'
import { supabase } from '@/config/supabase';
import { getTotalViewsForRoom } from '@/utils/artworkViewTracker';

const GalleryStats = ({ hostId, artwork, roomId }: any) => {
    const [donationStats, setDonationStats] = useState<{ total: number }>({ total: 0 });
    const [tipStats, setTipStats] = useState<{ total: number }>({ total: 0 });
    const [soldArtworks, setSoldArtworks] = useState<{ total: number }>({ total: 0 });
    const [totalViews, setTotalViews] = useState<number>(0);

    const fetchDonations = async () => {
        try {
            if (!hostId) {
                console.log('Host ID not available, skipping donation fetch');
                return;
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'Artwork Donation')
                .eq('user_id', hostId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching donations:', error);
                return;
            }

            const total = data?.reduce((sum, donation) => sum + donation.amount, 0) || 0;
            setDonationStats({ total });
        } catch (error) {
            console.error('Error fetching donations:', error);
        }
    };

    const fetchTips = async () => {
        try {
            if (!hostId) {
                console.log('Host ID not available, skipping donation fetch');
                return;
            }
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'Artwork Tip')
                .eq('user_id', hostId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching tips:', error);
                return;
            }
            const total = data?.reduce((sum, tip) => sum + tip.amount, 0) || 0;
            setTipStats({ total });
        } catch (error) {
            console.error('Error fetching tips:', error);
        }
    }

    const fetchSoldArtworks = async () => {
        try {
            if (!hostId) {
                console.log('Host ID not available, skipping sold artworks fetch');
                return;
            }

            // Count artworks that are marked as sold for this artist
            const { data, error } = await supabase
                .from('art_exhibit_room')
                .select('id')
                .eq('room_id', hostId)
                .eq('is_sold', true);

            if (error) {
                console.error('Error fetching sold artworks:', error);
                return;
            }

            setSoldArtworks({ total: data?.length || 0 });
        } catch (error) {
            console.error('Error fetching sold artworks:', error);
        }
    };

    const fetchTotalViews = async () => {
        try {
            if (!hostId) {
                console.log('Host ID not available, skipping total views fetch');
                return;
            }

            const views = await getTotalViewsForRoom(roomId);
            setTotalViews(views);
        } catch (error) {
            console.error('Error fetching total views:', error);
        }
    };

    useEffect(() => {
        if (!hostId) return;
        fetchDonations();
        fetchTips();
        fetchSoldArtworks();
        fetchTotalViews();
        
        // Subscribe to transaction changes
        const donations = supabase
            .channel('transactions')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
                if (payload.new.type === 'Artwork Donation') {
                    fetchDonations();
                } else if (payload.new.type === 'Artwork Tip') {
                    fetchTips();
                } else if (payload.new.type === 'Artwork Purchase') {
                    fetchSoldArtworks();
                }
            })
            .subscribe();

        // Subscribe to artwork status changes
        const artworkChanges = supabase
            .channel('artwork_status')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'art_exhibit_room' }, (payload) => {
                if (payload.new.is_sold === true) {
                    fetchSoldArtworks();
                }
            })
            .subscribe();

        // Subscribe to view changes
        const viewChanges = supabase
            .channel('artwork_views')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artwork_views' }, (payload) => {
                if (payload.new.room_id === roomId) {
                    fetchTotalViews();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(donations);
            supabase.removeChannel(artworkChanges);
            supabase.removeChannel(viewChanges);
        };

    }, [hostId]);

    return (
        <div className={styles.galleryStats}>
            <span className={styles.galleryStatsTitle}>Gallery Stats</span>
            <div className={styles.galleryStatsContent}>
                <div className={styles.galleryStatsContentItem}>
                    <span className={styles.galleryStatsContentItemTitle}>Total Views</span>
                    <span className={styles.galleryStatsContentItemValue}>{totalViews}</span>
                </div>
                <div className={styles.galleryStatsContentItem}>
                    <span className={styles.galleryStatsContentItemTitle}>ArtWorks</span>
                    <span className={styles.galleryStatsContentItemValue}>{artwork.length}</span>
                </div>
                <div className={styles.galleryStatsContentItem}>
                    <span className={styles.galleryStatsContentItemTitle}>Sold</span>
                    <span className={styles.galleryStatsContentItemValue}>{soldArtworks.total}</span>
                </div>
                <div className={styles.galleryStatsContentItem}>
                    <span className={styles.galleryStatsContentItemTitle}>Total Tip</span>
                    <span className={styles.galleryStatsContentTip}>${tipStats.total}</span>
                </div>
                <div className={styles.galleryStatsContentItem}>
                    <span className={styles.galleryStatsContentItemTitle}>Donations</span>
                    <span className={styles.galleryStatsContentTip}>${donationStats.total}</span>
                </div>
            </div>
        </div>
    )
}

export default GalleryStats