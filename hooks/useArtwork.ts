import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { Artwork } from '@/Components/pages/thinkTankMessageRoom/ArtExhibit/types';

interface UseArtworkProps {
  roomId?: string;
  hostId?: string;
  enabled?: boolean;
}

interface UseArtworkReturn {
  artwork: Artwork[];
  hostArtWork: Artwork[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addArtwork: (newArtwork: Artwork) => void;
  addHostArtWork: (newArtwork: Artwork) => void;
  refetchHostArtwork: () => Promise<void>;
  refetchParticipantArtwork: () => Promise<void>;
}

export const useArtwork = ({
  hostId,
  roomId,
  enabled = true
}: UseArtworkProps): UseArtworkReturn => {
  const [allArtwork, setAllArtwork] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized computed values
  const hostArtWork = allArtwork.filter(artwork => artwork.createdBy === hostId);
  const artwork = allArtwork.filter(artwork => artwork.createdBy !== hostId);

  // Single function to fetch all artwork
  const fetchAllArtwork = useCallback(async () => {
    if (!roomId || !enabled || !hostId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('art_exhibit_room')
        .select(`
          id,
          art_work_title,
          art_work_image,
          art_work_description,
          art_work_price,
          art_work_commentary_url,
          art_work_commentary_type,
          is_sold,
          room_host,
          created_by,
          created_at
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch artwork: ${fetchError.message}`);
      }

      const transformedArtwork: Artwork[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.art_work_title || '',
        imageUrl: item.art_work_image || '',
        description: item.art_work_description || '',
        price: item.art_work_price || 0,
        commentaryUrl: item.art_work_commentary_url || '',
        commentaryType: item.art_work_commentary_type || null,
        is_sold: item.is_sold || false,
        host: item.room_host,
        createdBy: item.created_by,
        createdAt: item.created_at
      }));

      setAllArtwork(transformedArtwork);
      console.log("Fetched all artwork:", transformedArtwork);
    } catch (err) {
      console.error('Error fetching artwork:', err);
      setError(err instanceof Error ? err.message : 'Failed to load artwork');
    } finally {
      setLoading(false);
    }
  }, [roomId, enabled, hostId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!roomId || !enabled) return;

    // Initial fetch
    fetchAllArtwork();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`art_exhibit_room:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'art_exhibit_room',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        console.log('Real-time update:', payload);

        if (payload.eventType === 'INSERT') {
          const newArtwork: Artwork = {
            id: payload.new.id,
            title: payload.new.art_work_title || '',
            imageUrl: payload.new.art_work_image || '',
            description: payload.new.art_work_description || '',
            price: payload.new.art_work_price || 0,
            medium: payload.new.art_work_medium || '',
            commentaryUrl: payload.new.art_work_commentary_url || '',
            commentaryType: payload.new.art_work_commentary_type || null,
            is_sold: payload.new.is_sold || false,
            host: payload.new.room_host,
            createdBy: payload.new.created_by
          };

          // Check for duplicates to prevent double-adding (optimistic update + realtime)
          setAllArtwork(prev => {
            const exists = prev.some(artwork => artwork.id === newArtwork.id);
            if (exists) {
              return prev;
            }
            return [newArtwork, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setAllArtwork(prev =>
            prev.map(artwork =>
              artwork.id === payload.new.id
                ? { ...artwork, ...payload.new }
                : artwork
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setAllArtwork(prev =>
            prev.filter(artwork => artwork.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, enabled, fetchAllArtwork]);

  // Optimistic updates for better UX
  const addArtwork = useCallback((newArtwork: Artwork) => {
    setAllArtwork(prev => [newArtwork, ...prev]);
  }, []);

  const addHostArtWork = useCallback((newArtwork: Artwork) => {
    setAllArtwork(prev => [newArtwork, ...prev]);
  }, []);

  return {
    artwork,
    hostArtWork,
    loading,
    error,
    refetch: fetchAllArtwork,
    addArtwork,
    addHostArtWork,
    refetchHostArtwork: fetchAllArtwork,
    refetchParticipantArtwork: fetchAllArtwork
  };
};