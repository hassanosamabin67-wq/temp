import { supabase } from "@/config/supabase";

export const updateClicksCount = async (profileId: string, serviceId: string) => {
    try {
        const { data, error } = await supabase
            .from("service")
            .select("clicks, profileId")
            .eq("id", serviceId)
            .single();

        if (data && profileId === data.profileId) {
            console.log("Skipping click")
            return
        }

        if (!error && data) {
            const newCount = (data.clicks || 0) + 1;

            const { error: updateError } = await supabase
                .from("service")
                .update({ clicks: newCount })
                .eq("id", serviceId);

            if (updateError) console.error("Error updating clicks:", updateError);
        }
    } catch (error) {
        console.error('Error in updating service clicks:', error);
    }
};