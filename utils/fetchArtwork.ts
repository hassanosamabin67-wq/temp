import { supabase } from "@/config/supabase";
import { Artwork } from "@/Components/pages/thinkTankMessageRoom/ArtExhibit/types";

export const fetchArtwork = async (
  roomId: string, 
  hostId?: string, 
  isHostArtwork: boolean = true
): Promise<Artwork[]> => {
  try {
    if (!roomId) {
      console.warn("Room ID is required for fetching artwork");
      return [];
    }

    let query = supabase
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
      .eq('room_id', roomId);

    if (hostId) {
      if (isHostArtwork) {
        // Host artwork: where the creator is the host
        query = query.eq('created_by', hostId);
      } else {
        // Participant artwork: where the creator is NOT the host
        query = query.neq('created_by', hostId);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error:", error);
      throw new Error(`Failed to fetch artwork: ${error.message}`);
    }

    console.log(`Fetched ${isHostArtwork ? 'host' : 'participant'} artwork:`, data);

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

    return transformedArtwork;
  } catch (err) {
    console.error("Unexpected error while fetching artwork:", err);
    throw err;
  }
};

// Optional: Add a function to fetch a single artwork by ID
export const fetchArtworkById = async (artworkId: string): Promise<Artwork | null> => {
  try {
    const { data, error } = await supabase
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
        created_by
      `)
      .eq('id', artworkId)
      .single();

    if (error) {
      console.error("Error fetching artwork by ID:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.art_work_title || '',
      imageUrl: data.art_work_image || '',
      description: data.art_work_description || '',
      price: data.art_work_price || 0,
      commentaryUrl: data.art_work_commentary_url || '',
      commentaryType: data.art_work_commentary_type || null,
      is_sold: data.is_sold || false,
      host: data.room_host,
      createdBy: data.created_by
    };
  } catch (err) {
    console.error("Error fetching artwork by ID:", err);
    return null;
  }
};