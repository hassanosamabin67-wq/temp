import { supabase } from "@/config/supabase";

type StatType = "impression" | "view" | "click";
type ProfileStats = {
    impressions?: number;
    views?: number;
    clicks?: number;
};
export async function recordProfileStat({
    profileId,
    userId,
    type
}: {
    profileId: string;
    userId: string;
    type: StatType;
}) {
    const column =
        type === "impression"
            ? "impressions"
            : type === "view"
                ? "views"
                : "clicks";

    try {
        const { data: existing, error: selectError } = await supabase
            .from("profile_stats")
            .select(column)
            .eq("profile_id", profileId)
            .eq("user_id", userId)
            .maybeSingle();

        if (selectError) {
            console.error("Error Fettching stats: ", selectError)
            return;
        };

        if (existing) {
            const { error: updateError } = await supabase
                .from("profile_stats")
                .update({
                    [column]: ((existing as ProfileStats)[column] || 0) + 1
                })
                .eq("profile_id", profileId)
                .eq("user_id", userId);

            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from("profile_stats")
                .insert({
                    profile_id: profileId,
                    user_id: userId,
                    impressions: column === "impressions" ? 1 : 0,
                    views: column === "views" ? 1 : 0,
                    clicks: column === "clicks" ? 1 : 0
                });

            if (insertError) throw insertError;
        }

        console.log(`✅ Recorded ${type} for profile ${profileId} by user ${userId}`);
    } catch (err) {
        console.error(`❌ Failed to record ${type}:`, err);
    }
}