import { supabase } from "@/config/supabase";
import { useEffect, useState } from "react";

const CALL_DURATION = 3600;

export function useCallTimer(channelId: string, calling: boolean, isConnected: boolean, onEnd: () => void) {
    const [timeLeft, setTimeLeft] = useState<number>(CALL_DURATION);
    const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        async function fetchStartTime() {
            const { data, error } = await supabase
                .from("Live")
                .select("created_at")
                .eq("id", channelId)
                .single();

            if (error || !data) {
                console.error(error);
                return;
            }

            const startTime = new Date(data.created_at).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setTimeLeft(Math.max(CALL_DURATION - elapsed, 0));

            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        onEnd();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            setCountdownInterval(interval)
        }

        if (calling && isConnected) {
            fetchStartTime();
        }

        return () => {
            clearInterval(interval);
        };
    }, [channelId, isConnected, calling]);

    return { timeLeft, countdownInterval };
}