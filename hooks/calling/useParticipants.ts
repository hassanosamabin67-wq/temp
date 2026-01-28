import { useEffect, useState } from "react";
import { supabase } from "@/config/supabase";
import userImage from '@/public/assets/img/userImg.webp'

export function useParticipants(channel: string, profile: any, tableName: string, currentUid: number | any) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [host, setHost] = useState<any>(null);

    const initializeHost = async () => {
        if (!channel || !profile?.profileId || !currentUid) return;

        try {
            // First, check if the call exists
            const { data: callData, error: callError } = await supabase
                .from(tableName)
                .select('host')
                .eq('id', channel)
                .single();

            if (callError) throw callError;
            if (!callData) throw new Error('Call not found');

            // If current user is the host, ensure they're added as a participant
            if (callData.host === profile.profileId) {
                await addOrUpdateParticipant({
                    id: profile.profileId,
                    name: profile.firstName || "Host",
                    picture: profile.profileImage || userImage.src,
                    role: "host"
                });
            }
        } catch (error) {
            console.error('Error initializing host:', error);
        }
    };

    // Subscribe to real-time changes in participants
    useEffect(() => {
        if (!channel) return;

        const initialize = async () => {
            await initializeHost();
            await fetchParticipants();
        };

        const subscription = supabase
            .channel(`call_participants_${channel}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'call_participants',
                    filter: `call_id=eq.${channel}`
                },
                (payload) => {
                    // Handle participant changes
                    fetchParticipants();
                }
            )
            .subscribe();

        initialize();

        return () => {
            subscription.unsubscribe();
        };
    }, [channel]);

    const fetchParticipants = async () => {
        if (!channel) return;

        // Fetch the call details to get the host
        const { data: callData } = await supabase
            .from(tableName)
            .select("host, host_agora_id")
            .eq("id", channel)
            .single();

        if (callData) {
            setHost(callData.host);

            // Fetch all participants for this call
            const { data: participantsData } = await supabase
                .from('call_participants')
                .select('*')
                .eq('call_id', channel)
                .order('created_at', { ascending: true });

            if (participantsData) {
                setParticipants(participantsData);
            }
        }
    };

    const addOrUpdateParticipant = async (participantData: any) => {
        if (!channel || !profile?.profileId) return;

        const { data, error } = await supabase
            .from('call_participants')
            .upsert(
                {
                    call_id: channel,
                    user_id: participantData.id,
                    agora_uid: currentUid,
                    name: participantData.name,
                    picture: participantData.picture || userImage.src,
                    role: participantData.role,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'call_id,user_id',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error) {
            console.error('Error adding/updating participant:', error);
        }

        return data;
    };

    const removeParticipant = async (userId: string) => {
        if (!channel) return;

        const { error } = await supabase
            .from('call_participants')
            .delete()
            .eq('call_id', channel)
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing participant:', error);
        }
    };

    return {
        host,
        participants,
        setParticipants,
        addOrUpdateParticipant,
        removeParticipant
    };
}