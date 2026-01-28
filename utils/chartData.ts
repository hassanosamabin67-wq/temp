import { supabase } from "@/config/supabase";

type Point = { x: string; y: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getStatsOverviewData(profileId: string): Promise<{ views: Point[]; clicks: Point[] }> {
    if (!profileId) return { views: [], clicks: [] };

    // range: from 1st day of the month 11 months ago → end of current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data, error } = await supabase
        .from("profile_stats")
        .select("views, clicks, created_at")
        .eq("user_id", profileId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

    if (error) {
        console.error("Error fetching profile_stats for chart:", error);
        return { views: [], clicks: [] };
    }

    // Bucket by YYYY-MM for stability, then map to display month label
    const buckets = new Map<
        string,
        { views: number; clicks: number; label: string }
    >();

    // Pre-seed 12 months with zeros
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets.set(key, {
            views: 0,
            clicks: 0,
            label: MONTHS[d.getMonth()],
        });
    }

    // Sum rows into buckets
    (data ?? []).forEach((row) => {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = buckets.get(key);
        if (bucket) {
            bucket.views += Number(row.views || 0);
            bucket.clicks += Number(row.clicks || 0);
        }
    });

    // Produce series in chronological order
    const keys = Array.from(buckets.keys()).sort();
    const views: Point[] = [];
    const clicks: Point[] = [];

    keys.forEach((k) => {
        const b = buckets.get(k)!;
        views.push({ x: b.label, y: b.views });
        clicks.push({ x: b.label, y: b.clicks });
    });

    return { views, clicks };
}