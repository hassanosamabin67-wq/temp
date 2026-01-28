import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import ThemedModal from '@/Components/UIComponents/ThemedModal';
import { HiOutlineUserPlus } from 'react-icons/hi2';

interface CoHostInvitation {
    liveStreamId: string;
    hostName: string;
    roomName: string;
}

const CoHostInvitationModal = () => {
    const profile = useAppSelector((state) => state.auth);
    const [invitation, setInvitation] = useState<CoHostInvitation | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { notify } = useNotification();

    useEffect(() => {
        if (!profile?.profileId) return;

        const channel = supabase
            .channel(`cohost-invitation-${profile.profileId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'live_stream',
                },
                async (payload: any) => {
                    const updated = payload.new;
                    if (!updated) return;

                    const participants = updated.participants || [];
                    const myParticipant = participants.find(
                        (p: any) => p.id === profile.profileId
                    );

                    // Check if this user was just invited as co-host
                    if (
                        myParticipant?.stream_role === 'co-host' &&
                        myParticipant?.invitation_status === 'pending'
                    ) {
                        // Fetch host details
                        const hostInfo = participants.find((p: any) => p.stream_role === 'host');

                        setInvitation({
                            liveStreamId: updated.id,
                            hostName: hostInfo?.name || 'Host',
                            roomName: updated.room_name || 'Live Stream',
                        });
                        setIsVisible(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.profileId]);

    const handleAccept = async () => {
        if (!invitation) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('live_stream')
                .select('participants')
                .eq('id', invitation.liveStreamId)
                .single();

            if (fetchError) throw fetchError;

            const updatedParticipants = data.participants.map((p: any) => {
                if (p.id === profile.profileId) {
                    return { ...p, invitation_status: 'accepted' };
                }
                return p;
            });

            const { error: updateError } = await supabase
                .from('live_stream')
                .update({ participants: updatedParticipants })
                .eq('id', invitation.liveStreamId);

            if (updateError) throw updateError;

            notify({
                type: 'success',
                message: 'You are now a co-host! You can share your camera and microphone.',
            });

            setIsVisible(false);
            setInvitation(null);
        } catch (error) {
            console.error('Error accepting invitation:', error);
            notify({ type: 'error', message: 'Failed to accept invitation' });
        }
    };

    const handleDecline = async () => {
        if (!invitation) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('live_stream')
                .select('participants')
                .eq('id', invitation.liveStreamId)
                .single();

            if (fetchError) throw fetchError;

            const updatedParticipants = data.participants.map((p: any) => {
                if (p.id === profile.profileId) {
                    return { ...p, stream_role: 'audience', invitation_status: null };
                }
                return p;
            });

            const { error: updateError } = await supabase
                .from('live_stream')
                .update({ participants: updatedParticipants })
                .eq('id', invitation.liveStreamId);

            if (updateError) throw updateError;

            notify({
                type: 'info',
                message: 'Co-host invitation declined',
            });

            setIsVisible(false);
            setInvitation(null);
        } catch (error) {
            console.error('Error declining invitation:', error);
            notify({ type: 'error', message: 'Failed to decline invitation' });
        }
    };

    return (
        <ThemedModal
            roomType="soundscape"
            themedTitle={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                        <HiOutlineUserPlus size={20} />
                    </span>
                    <span>Co-Host Invitation</span>
                </div>
            }
            open={isVisible}
            closable={false}
            footer={null}
            width={400}
        >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ marginBottom: '24px', fontSize: '15px' }}>
                    <strong>K.{invitation?.hostName}</strong> has invited you to be a co-host in{' '}
                    <strong>{invitation?.roomName}</strong>
                </p>
                <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
                    As a co-host, you'll be able to share your camera and microphone with all participants.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Button size="large" onClick={handleDecline}>
                        Decline
                    </Button>
                    <Button type="primary" size="large" onClick={handleAccept}>
                        Accept
                    </Button>
                </div>
            </div>
        </ThemedModal>
    );
};

export default CoHostInvitationModal;