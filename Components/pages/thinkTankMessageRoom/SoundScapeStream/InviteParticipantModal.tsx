import React, { useEffect, useState } from 'react';
import { Modal, List, Avatar, Button } from 'antd';
import { UserAddOutlined, CheckOutlined } from '@ant-design/icons';
import { useNotification } from '@/Components/custom/custom-notification';
import { supabase } from '@/config/supabase';
import ThemedModal from '@/Components/UIComponents/ThemedModal';
import { HiOutlineUsers } from 'react-icons/hi2';

const InviteParticipantModal = ({
    open,
    onCancel,
    onInvite,
    liveStreamId,
    onRemove
}: {
    open: boolean;
    onCancel: () => void;
    liveStreamId: string;
    onInvite: (participantId: string) => Promise<void>;
    onRemove: (participantId: string) => Promise<void>;
}) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [removeLoading, setRemoveLoading] = useState<string | null>(null);
    const { notify } = useNotification();
    const [participants, setParticipants] = useState<any[]>([])

    const handleInvite = async (participant: any) => {
        setLoading(participant.id);
        try {
            await onInvite(participant.id);
            notify({
                type: 'success',
                message: `${participant.name} can now share their camera/mic`
            });
            onCancel()
        } catch (error) {
            console.error('Failed to invite participant');
            notify({
                type: 'error',
                message: `Failed to invite participant`
            });
        } finally {
            setLoading(null);
        }
    };

    const handleRemove = async (participant: any) => {
        setRemoveLoading(participant.id);
        try {
            await onRemove(participant.id);
            notify({
                type: 'success',
                message: `${participant.name} is now audience`
            });
            onCancel()
        } catch (error) {
            console.error('Failed to remove participant', error);
            notify({
                type: 'error',
                message: `Failed to remove participant ${error}`
            });
        } finally {
            setRemoveLoading(null);
        }
    };

    // Filter out host and show all participants with their status
    const audienceMembers = participants.filter(p => p.role !== 'host');
    const existingCoHost = participants.find(p => p.stream_role === 'co-host');
    const isInviteExcepted = existingCoHost?.invitation_status === 'accepted';

    const fetchStreamParticipants = async () => {
        try {
            const { data, error } = await supabase
                .from('live_stream')
                .select('participants, created_at, stream_type')
                .eq('id', liveStreamId)
                .single();

            if (error || !data) {
                console.error("Error fetching stream data", error);
                return;
            }
            setParticipants(data.participants)
        } catch (error) {
            console.error("Unexpected Error while fettching sttream partticipantts:", error)
        }
    }

    useEffect(() => {
        fetchStreamParticipants()
    }, [participants])

    return (
        <ThemedModal
            roomType="soundscape"
            themedTitle={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                        <HiOutlineUsers size={20} />
                    </span>
                    <span>Invite Participants to Share</span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={500}
        >
            <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#000000ff', fontSize: 14 }}>
                    Invite participants to share their camera and microphone during the stream.
                </p>
            </div>

            {audienceMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#000000ff' }}>
                    No audience members to invite
                </div>
            ) : (
                <List
                    dataSource={audienceMembers}
                    renderItem={(participant: any) => (
                        <List.Item
                            actions={[
                                (participant.stream_role === 'co-host' && isInviteExcepted) ? (
                                    <div>
                                        <Button
                                            type="text"
                                            size='small'
                                            icon={<CheckOutlined />}
                                            style={{ color: '#52c41a' }}
                                        >
                                            Co-host
                                        </Button>
                                        <Button
                                            type="text"
                                            size='small'
                                            style={{ color: '#c41a1aff' }}
                                            loading={removeLoading === participant.id}
                                            onClick={() => handleRemove(participant)}
                                        >
                                            Remove Co-host
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<UserAddOutlined />}
                                        loading={loading === participant.id}
                                        onClick={() => handleInvite(participant)}
                                        disabled={!!existingCoHost && existingCoHost.id !== participant.id}
                                    >
                                        Invite
                                    </Button>
                                )
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        src={participant.picture}
                                        size={40}
                                    >
                                        {participant.name?.[0]?.toUpperCase()}
                                    </Avatar>
                                }
                                title={`K.${participant.name}`}
                                description={
                                    participant.stream_role === 'co-host'
                                        ? 'Can share camera/mic'
                                        : 'Audience member'
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </ThemedModal>
    );
};

export default InviteParticipantModal;