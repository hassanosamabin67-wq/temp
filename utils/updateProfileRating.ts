import { supabase } from "@/config/supabase";

interface profileUpdateInterface {
    profileId: string;
    rating: number;
}

export async function updateProfileRating(params: profileUpdateInterface) {
    const { data: profileRating, error: profileRatingError } = await supabase
        .from("users")
        .select("overall_rating")
        .eq("userId", params.profileId)
        .single();

    if (profileRatingError) throw profileRatingError;

    const newCount = (profileRating.overall_rating || 0) + 1;

    const { data, error } = await supabase
        .from('users')
        .update({ overall_rating: newCount })
        .eq("userId", params.profileId)
        .select()
        .single()

    if (error) throw error
    return data
}