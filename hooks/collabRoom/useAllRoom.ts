import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';

interface useAllRoomProps {
    profile: any;
    getUserRoom?: boolean;
    receiverId?: string | null;
}

type ParticipantsMap = Record<string | number, Set<string>>;

const useAllRoom = ({ profile, getUserRoom, receiverId }: useAllRoomProps) => {
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [collabRooms, setCollabRooms] = useState<any>([]);
    // totalParticipants kept if you still need global count, otherwise optional
    const [totalParticipants, setTotalParticipants] = useState<number>(0);
    // map: think_tank_id -> Set(participant_id)
    const [roomParticipantsMap, setRoomParticipantsMap] = useState<ParticipantsMap>({});

    // helper: normalize id to string for consistent Set membership
    const normalizeId: any = (id: any) => (id == null ? null : String(id));

    // single buildParticipantsMap helper to avoid repeating code
    const buildParticipantsMap = (participantsData: any[] = []) => {
        const map: ParticipantsMap = {};
        for (const row of participantsData) {
            const roomId = row.think_tank_id;
            const pid = String(row.participant_id);
            if (!map[roomId]) map[roomId] = new Set();
            map[roomId].add(pid);
        }
        return map;
    };

    const getAllTanks = async () => {
        try {
            setConfirmLoading(true);

            if (getUserRoom && receiverId) {
                const { data: senderRooms, error: senderError } = await supabase
                    .from('think_tank_participants')
                    .select('think_tank_id')
                    .eq('participant_id', profile.profileId);

                const { data: receiverRooms, error: receiverError } = await supabase
                    .from('think_tank_participants')
                    .select('think_tank_id')
                    .eq('participant_id', receiverId);

                if (senderError || receiverError) {
                    console.error('Error fetching user rooms', senderError || receiverError);
                    return;
                }

                const senderIds = (senderRooms || []).map((row: any) => row.think_tank_id);
                const receiverIds = (receiverRooms || []).map((row: any) => row.think_tank_id);

                const sharedIds = senderIds.filter((id: any) => receiverIds.includes(id));

                if (sharedIds.length === 0) {
                    setCollabRooms(null);
                    setRoomParticipantsMap({});
                    setTotalParticipants(0);
                    return;
                }

                // Fetch participants for each shared room
                const { data: participantsData, error: participantsError } = await supabase
                    .from('think_tank_participants')
                    .select('think_tank_id, participant_id')
                    .in('think_tank_id', sharedIds);

                if (participantsError) {
                    console.error('Error fetching participants', participantsError);
                    return;
                }

                const participantsMap = buildParticipantsMap(participantsData || []);
                setRoomParticipantsMap(participantsMap);

                // global count if needed
                setTotalParticipants((participantsData || []).length || 0);

                // Filter room IDs with exactly these two participants
                const validRoomIds = sharedIds.filter((roomId) => {
                    const participants = (participantsData || [])
                        .filter((p: any) => p.think_tank_id === roomId)
                        .map((p: any) => p.participant_id);
                    return (
                        participants.length === 2 &&
                        participants.includes(profile.profileId) &&
                        participants.includes(receiverId)
                    );
                });

                if (validRoomIds.length === 0) {
                    setCollabRooms(null);
                    return;
                }

                const { data: roomData, error: roomError } = await supabase
                    .from('thinktank')
                    .select('*')
                    .in('id', validRoomIds);

                if (roomError) {
                    console.error('Error fetching think tank room', roomError);
                    return;
                }

                const now = new Date();

                const validRooms = (roomData || []).filter((tank: any) => {
                    const expiryDate = new Date(tank.end_datetime);
                    return expiryDate >= now;
                });

                setCollabRooms(validRooms.length ? validRooms : null);
                return;
            }

            // General case
            const { data, error } = await supabase.from('thinktank').select('*');
            if (error) {
                console.error('Error fetching think tanks', error);
                return;
            }

            const now = new Date();

            if (!profile.profileId) {
                const filtered = (data || []).filter((tank: any) => {
                    let expiryDate;
                    if (tank.recurring === 'One-Time Think Tank') {
                        expiryDate = new Date(tank.one_time_date);
                    } else {
                        expiryDate = new Date(tank.end_datetime);
                    }
                    if (!expiryDate || isNaN(expiryDate.getTime())) return false;
                    if (expiryDate < now) return false;
                    return tank.accesstype === 'Open';
                });

                // collect room IDs and participants for those rooms
                const tankIds = (filtered || []).map((row: any) => row.id);
                if (tankIds.length) {
                    const { data: participantsData, error: participantsError } = await supabase
                        .from('think_tank_participants')
                        .select('think_tank_id, participant_id')
                        .in('think_tank_id', tankIds);

                    if (participantsError) {
                        console.error('Error fetching ttank participants', participantsError);
                        // continue but clear map
                        setRoomParticipantsMap({});
                        setTotalParticipants(0);
                    } else {
                        const participantsMap = buildParticipantsMap(participantsData || []);
                        setRoomParticipantsMap(participantsMap);
                        setTotalParticipants((participantsData || []).length || 0);
                    }
                } else {
                    setRoomParticipantsMap({});
                    setTotalParticipants(0);
                }

                setCollabRooms(filtered);
                return;
            }

            if (data) {
                const isValidTank = (tank: any) => {
                    if (tank.recurring === 'One-Time Think Tank') {
                        const expiryDate = new Date(tank.one_time_date);
                        if (expiryDate < now) return false;
                        if (tank.accesstype === 'Open' || tank.accesstype === 'Private') return true;
                        if (tank.accesstype === 'Limited') return true;
                        return false;
                    }
                    const expiryDate = new Date(tank.end_datetime);
                    if (expiryDate < now) return false;

                    if (tank.accesstype === 'Open' || tank.accesstype === 'Private') return true;
                    if (tank.accesstype === 'Limited') return true;
                    return false;
                };

                const visibleTanks = (data || []).filter(isValidTank);
                const tankIds = (visibleTanks || []).map((row: any) => row.id);

                if (tankIds.length) {
                    const { data: participantsData, error: participantsError } = await supabase
                        .from('think_tank_participants')
                        .select('think_tank_id, participant_id')
                        .in('think_tank_id', tankIds);

                    if (participantsError) {
                        console.error('Error fetching ttank participants', participantsError);
                        setRoomParticipantsMap({});
                        setTotalParticipants(0);
                    } else {
                        const participantsMap = buildParticipantsMap(participantsData || []);
                        setRoomParticipantsMap(participantsMap);
                        setTotalParticipants((participantsData || []).length || 0);
                    }
                } else {
                    setRoomParticipantsMap({});
                    setTotalParticipants(0);
                }

                const sortedTanks = visibleTanks.sort((a: any, b: any) => {
                    const boostA = Number(a.requested_boosting) || 0;
                    const boostB = Number(b.requested_boosting) || 0;
                    return boostB - boostA;
                });

                setCollabRooms(sortedTanks);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setConfirmLoading(false);
        }
    };

    useEffect(() => {
        getAllTanks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.profileId, getUserRoom, receiverId]);

    //
    // Helpers for consumers of the hook
    //

    /**
     * Get number of participants excluding the host (host counted only if present in participants set)
     */
    const getParticipantsExcludingHost = (roomId: string | number, hostId?: string | number) => {
        const set = roomParticipantsMap[roomId];
        if (!set) return 0;
        const hostPresent = hostId ? set.has(normalizeId(hostId)) : false;
        return set.size - (hostPresent ? 1 : 0);
    };

    /**
     * Return true if userId (current user) is in participants set for the room.
     */
    const isUserParticipant = (roomId: string | number, userId?: string | number) => {
        if (!userId) return false;
        const set = roomParticipantsMap[roomId];
        if (!set) return false;
        return set.has(normalizeId(userId));
    };

    /**
     * Return true if the given userId is the host for the tank (strict equality, normalized).
     */
    const isUserHost = (userId?: string | number, hostId?: string | number) => {
        if (!userId || hostId == null) return false;
        return normalizeId(userId) === normalizeId(hostId);
    };

    /**
     * Return true if the room is full based on available_spots and participants EXCLUDING host.
     * If available_spots is null/NaN => treat as unlimited (not full).
     */
    const isRoomFull = (roomId: string | number, tankAvailableSpots?: number | string, hostId?: string | number) => {
        const spotsRaw = tankAvailableSpots;
        if (spotsRaw == null) return false; // unlimited
        const spots = parseInt(String(spotsRaw), 10);
        if (isNaN(spots)) return false;
        const participantsExHost = getParticipantsExcludingHost(roomId, hostId);
        return participantsExHost >= spots;
    };

    return {
        confirmLoading,
        collabRooms,
        setCollabRooms,
        refreshRooms: getAllTanks,
        totalParticipants,
        // expose map + helpers
        roomParticipants: roomParticipantsMap,
        getParticipantsExcludingHost,
        isUserParticipant,
        isUserHost,
        isRoomFull,
    };
};

export default useAllRoom;