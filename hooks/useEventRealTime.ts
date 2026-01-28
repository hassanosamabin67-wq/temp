import { useEffect } from "react";
import { supabase } from "@/config/supabase";

type UpdateCallback = (payload: any) => void;

export function useEventRealTime(thinkTankId: string, onUpdate: UpdateCallback) {
    useEffect(() => {
        const channel = supabase
            .channel('realtime-think_tank_events')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'think_tank_events',
                    filter: `think_tank_id=eq.${thinkTankId}`,
                },
                (payload) => {
                    onUpdate(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [thinkTankId, onUpdate]);
}