import { useEffect, useState } from "react";
import { supabase } from "@/config/supabase";

export const useJoinChannel = (
    endpoint: string,
    channel: string,
    tableName: string,
    isHost: boolean = false,
    isCoHost: boolean = false,
    context?: string
) => {
    const [rtcToken, setRtcToken] = useState<string | null>(null);
    const [currentLiveStatus, setCurrentLiveStatus] = useState<"live" | "lock" | "end" | null>(null);
    const [calling, setCalling] = useState(false);

    useEffect(() => {
        const joinChannel = async () => {
            const { data, error } = await supabase
                .from(tableName)
                .select("status")
                .eq("id", channel)
                .single();

            if (error || !data) {
                console.error("Error fetching live status:", error);
                return;
            }

            if (data.status === "end") {
                console.log("Call has already ended.");
                setCurrentLiveStatus("end");
                return;
            }

            // Determine role for token generation
            const role = isHost ? 'host' : isCoHost ? 'co-host' : 'audience';

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelName: channel,
                    ...(context && { role })
                }),
            });

            const tokenData = await res.json();
            setRtcToken(tokenData.token);
            setCalling(true);
            setCurrentLiveStatus(data.status);
        };

        if (channel) {
            joinChannel();
        }
    }, [channel, isHost, isCoHost]); // Add isCoHost to dependencies

    return {
        rtcToken,
        currentLiveStatus,
        calling,
        setCalling,
        setCurrentLiveStatus
    } as JoinChannelResult;
};