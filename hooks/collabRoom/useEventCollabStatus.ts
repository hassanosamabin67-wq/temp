import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabase';

interface UseEventCollabStatusProps {
    profileId: string;
}

export const useEventCollabStatus = ({
    profileId,
}: UseEventCollabStatusProps) => {
    const router = useRouter();

    useEffect(() => {
        const subscription = supabase
            .channel(`event-collab-global`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "think_tank_events",
                },
                async (payload: any) => {
                    const updatedThinkTankId = payload.new?.think_tank_id;
                    if (!updatedThinkTankId) return;

                    const newStatus = payload.new?.status;

                    if (newStatus === 'started') {
                        const participants = Array.isArray(payload.new?.participants) ? payload.new.participants : [];
                        const isParticipant = participants.some((p: any) => String(p?.id) === String(profileId));

                        let isDbParticipant = false;
                        try {
                            const { data: ttp, error: ttpErr } = await supabase
                                .from('think_tank_participants')
                                .select('participant_id')
                                .eq('think_tank_id', updatedThinkTankId)
                                .eq('participant_id', profileId)
                                .limit(1);
                            if (!ttpErr && Array.isArray(ttp) && ttp.length > 0) {
                                isDbParticipant = true;
                            }
                        } catch (err) {
                            console.warn('think_tank_participants check threw', err);
                        }

                        if (isParticipant || isDbParticipant) {
                            setTimeout(() => {
                                router.push(`/think-tank/room/${updatedThinkTankId}`);
                            }, 500);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [profileId, router]);
};