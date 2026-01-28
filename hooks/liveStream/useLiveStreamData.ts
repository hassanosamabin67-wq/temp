import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/config/supabase';

const useLiveStreamData = (streamId: string, profile: any) => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [host, setHost] = useState<{ id: string, name: string, picture: string, role: string, title?: string }>({ id: "", name: '', picture: "", role: "", title: "" });
    const [created_at, setCreated_at] = useState<string>("");
    const [streamType, setStreamType] = useState("");
    const channelRef = useRef<any>(null);

    // Effect for fetching initial data and adding current user as participant
    useEffect(() => {
        if (!streamId || !profile?.profileId) return;

        const fetchInitialData = async () => {
            const { data, error } = await supabase
                .from('live_stream')
                .select('participants, created_at, stream_type')
                .eq('id', streamId)
                .single();

            if (error || !data) {
                console.error("Error fetching stream data", error);
                return;
            }

            const isHost = data.participants.find((p: any) => p.role === "host");
            setHost(isHost);
            setCreated_at(data.created_at);
            setStreamType(data.stream_type);

            const existingParticipant = data.participants.find((p: any) => p.id === profile.profileId);

            if (!existingParticipant) {
                const newParticipant = {
                    id: profile.profileId,
                    name: profile.firstName,
                    picture: profile.profileImage,
                    role: "participant",
                    stream_role: "audience",
                    title: profile.title || ""
                };

                const updatedParticipants = [...data.participants, newParticipant];

                const { error: updateError } = await supabase
                    .from("live_stream")
                    .update({ participants: updatedParticipants })
                    .eq("id", streamId);

                if (updateError) {
                    console.error("Failed to add participant:", updateError);
                } else {
                    setParticipants(updatedParticipants);
                }
            } else {
                setParticipants(data.participants);
            }
        };

        fetchInitialData();
    }, [streamId, profile?.profileId]);

    // Separate effect for real-time subscription to avoid re-subscribing on profile changes
    useEffect(() => {
        if (!streamId) return;

        // Clean up existing channel if any
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channelName = `live-stream-data-${streamId}-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'live_stream',
                    filter: `id=eq.${streamId}`,
                },
                (payload: any) => {
                    console.log('Live stream realtime update received:', payload);
                    const next = payload.new;
                    if (!next) return;

                    const newParticipants = next.participants || [];
                    console.log('Updating participants:', newParticipants);
                    setParticipants(newParticipants);

                    // Also update host in case it changes
                    const hostData = newParticipants.find((p: any) => p.role === "host");
                    if (hostData) {
                        setHost(hostData);
                    }

                    // Update stream type if changed
                    if (next.stream_type) {
                        setStreamType(next.stream_type);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log(`Subscription status for ${channelName}:`, status);
                if (err) {
                    console.error('Subscription error:', err);
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [streamId]);

    return { participants, setParticipants, host, created_at, streamType };
};

export default useLiveStreamData;