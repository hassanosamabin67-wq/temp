import { supabase } from '@/config/supabase';

export interface ArtworkView {
  id?: string;
  artwork_id: string;
  viewer_id?: string;
  room_id: string;
  viewed_at: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Track a view for a specific artwork
 * @param artworkId - The ID of the artwork being viewed
 * @param roomId - The room ID where the artwork is displayed
 * @param viewerId - Optional user ID of the viewer (if authenticated)
 */
export const trackArtworkView = async (
  artworkId: string,
  roomId: string,
  viewerId?: string
): Promise<void> => {
  try {
    // Check if we already have a view from this user for this artwork in the last 24 hours
    // This prevents spam views from the same user
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: existingView } = await supabase
      .from('artwork_views')
      .select('id')
      .eq('artwork_id', artworkId)
      .eq('viewer_id', viewerId || 'anonymous')
      .gte('viewed_at', twentyFourHoursAgo.toISOString())
      .limit(1);

    // If no recent view exists, record a new view
    if (!existingView || existingView.length === 0) {
      const viewData: ArtworkView = {
        artwork_id: artworkId,
        room_id: roomId,
        viewer_id: viewerId || 'anonymous',
        viewed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('artwork_views')
        .insert([viewData]);

      if (error) {
        console.error('Error tracking artwork view:', error);
      }
    }
  } catch (error) {
    console.error('Error in trackArtworkView:', error);
  }
};

/**
 * Get total view count for all artworks in a room
 * @param roomId - The room ID
 * @returns Total view count
 */
export const getTotalViewsForRoom = async (roomId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('artwork_views')
      .select('id')
      .eq('room_id', roomId);

    if (error) {
      console.error('Error fetching total views:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in getTotalViewsForRoom:', error);
    return 0;
  }
};

/**
 * Get view count for a specific artwork
 * @param artworkId - The artwork ID
 * @returns View count for the artwork
 */
export const getArtworkViewCount = async (artworkId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('artwork_views')
      .select('id')
      .eq('artwork_id', artworkId);

    if (error) {
      console.error('Error fetching artwork view count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in getArtworkViewCount:', error);
    return 0;
  }
}; 