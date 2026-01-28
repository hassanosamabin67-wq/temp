import { useEffect, useState, useRef } from "react";
import { useRTCClient } from "agora-rtc-react";

type ActiveMap = Record<string | number, number>; // uid -> lastSeenTimestamp

const SENSITIVITY_LEVEL = 50; // tweak: higher -> less sensitive
const COOLDOWN_MS = 800; // keep speaker highlighted for this long after last volume event

export default function useActiveSpeakers(pollInterval = 200) {
    const client = useRTCClient();
    const [activeSpeakers, setActiveSpeakers] = useState<(string | number)[]>([]);
    const lastSeenRef = useRef<ActiveMap>({});

    useEffect(() => {
        if (!client) return;

        // enable volume indicator; interval in ms
        try {
            // Some SDK versions accept an interval param
            // @ts-ignore
            client.enableAudioVolumeIndicator && client.enableAudioVolumeIndicator(pollInterval);
        } catch (e) {
            // ignore if not supported
        }

        const handleVolume = (volumes: any[]) => {
            const now = Date.now();

            // volumes is an array of { uid, level, vad, ... } depending on SDK
            volumes.forEach((v) => {
                // local user often has uid === 0 in some SDKs; convert to string to be consistent
                const uid = v.uid ?? "local";
                if (v.level > SENSITIVITY_LEVEL) {
                    lastSeenRef.current[uid] = now;
                }
            });

            // cleanup: remove stale uids
            const newActive: (string | number)[] = [];
            Object.entries(lastSeenRef.current).forEach(([uid, ts]) => {
                if (now - ts <= COOLDOWN_MS) {
                    newActive.push(uid);
                } else {
                    delete lastSeenRef.current[uid];
                }
            });

            setActiveSpeakers(newActive);
        };

        client.on && client.on("volume-indicator", handleVolume);

        const interval = setInterval(() => {
            // periodic check to remove stale entries in case events stop
            const now = Date.now();
            const newActive: (string | number)[] = [];
            Object.entries(lastSeenRef.current).forEach(([uid, ts]) => {
                if (now - ts <= COOLDOWN_MS) {
                    newActive.push(uid);
                } else {
                    delete lastSeenRef.current[uid];
                }
            });
            setActiveSpeakers(newActive);
        }, Math.max(200, pollInterval));

        return () => {
            client.off && client.off("volume-indicator", handleVolume);
            clearInterval(interval);
            // disable indicator if needed (optional)
            try {
                // @ts-ignore
                client.enableAudioVolumeIndicator && client.enableAudioVolumeIndicator(0);
            } catch (e) { }
        };
    }, [client, pollInterval]);

    return activeSpeakers;
}