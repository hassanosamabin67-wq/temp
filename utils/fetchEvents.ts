import { supabase } from "@/config/supabase";

export const fetchThinkTankEvents = async (thinkTankId: string) => {
    try {
        const { data, error } = await supabase
            .from('think_tank_events')
            .select("*")
            .eq("think_tank_id", thinkTankId);

        if (error) {
            console.error("Supabase Error:", error);
            return [];
        }

        return data ?? [];
    } catch (err) {
        console.error("Unexpected error while fetching events:", err);
        return [];
    }
};