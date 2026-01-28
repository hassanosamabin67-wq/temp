import { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-react";
import { supabase } from "@/config/supabase";
import { useAppSelector } from "@/store";

export function useScreenShare(appId: string, channel: string, rtcToken: string | null, setScreenSharingUser: any, currentUid: number | any) {
    const [screenSharing, setScreenSharing] = useState(false);
    const [screenTrack, setScreenTrack] = useState<any>(null);
    const [screenClient] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const [screenUid, setScreenUid] = useState<number | null>(null);
    const profile = useAppSelector((state) => state.auth);

    const startScreenShare = async (): Promise<number | null> => {
        try {
            const track = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1", optimizationMode: "detail" });
            const assignedUid = await screenClient.join(appId, channel, rtcToken || null, null);
            await screenClient.publish(track);
            setScreenTrack(track);
            setScreenSharing(true);
            setScreenUid(assignedUid as number);
            return assignedUid as number;
        } catch (err) {
            console.error("Failed to start screen sharing:", err);
            return null;
        }
    };

    const stopScreenShare = async () => {
        try {
            if (screenTrack) {
                screenTrack.stop();
                screenTrack.close();
                await screenClient.leave();
                setScreenSharing(false);
                setScreenTrack(null);
                setScreenUid(null);
            }
        } catch (err) {
            console.error("Failed to stop screen sharing:", err);
        }
    };

    const toggleScreenShare = async (user: { userId: string, name: string }) => {
        try {
            if (screenSharing) {
                await stopScreenShare();
                const { error } = await supabase
                    .from("Live")
                    .update({ agora_id: null })
                    .eq("id", channel);
                if (error) {
                    console.error("Error removing screen sharing user:", error);
                    return;
                }
            } else {
                const assignedUid = await startScreenShare();
                const { error } = await supabase
                    .from("Live")
                    .update({ agora_id: assignedUid })
                    .eq("id", channel);
                if (error) {
                    console.error("Error adding screen sharing user:", error);
                    await stopScreenShare();
                    return;
                }
                if (assignedUid !== null) {
                    setScreenSharingUser(assignedUid)
                }
            }
        } catch (err) {
            console.error("Unexpected Error:", err);
        }
    };

    return { screenSharing, stopScreenShare, toggleScreenShare };
}