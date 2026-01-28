'use client'
import React, { useEffect, useState } from 'react';
import styles from './style.module.css';
import { Button, Empty, Spin } from 'antd';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import { useRouter } from 'next/navigation';
import { fetchRoomInvitationData } from '@/lib/fetchRoomInvitationData';
import { collabRoomAcceptedNotificationWithEmail } from '@/lib/collabRoomNotifications';

const InvitationPage = ({ invitationId }: any) => {
    const [inviteData, setInviteData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingAcceptInvite, setLoadingAcceptInvite] = useState(false);
    const [invitationStatus, setInvitationStatus] = useState("");
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const router = useRouter();

    const fetchInvitation = async (id: string) => {
        try {
            setLoadingData(true);
            if (!profile.profileId) {
                router.push('/login');
                return
            }
            const combinedData = await fetchRoomInvitationData(id);
            setInvitationStatus(combinedData.invitation.status);
            setInviteData(combinedData);
        } catch (error) {
            console.error("Error loading invitation data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAcceptInvite = async (inviteId: string, profileId: string) => {
        try {
            setLoadingAcceptInvite(true);

            const { thinktank, sender } = await fetchRoomInvitationData(inviteId);

            const { data: updatedInvitation, error: invitationError } = await supabase
                .from("invitation")
                .update({ status: "Accepted" })
                .eq("id", inviteId)
                .eq("receiver_id", profileId)
                .select("*")
                .single();

            if (invitationError) {
                console.error("Error accepting invitation:", invitationError);
                return;
            }

            const { error: participantError } = await supabase.from('think_tank_participants').insert({
                status: "Accepted",
                think_tank_id: updatedInvitation.action,
                participant_id: profileId,
                is_agreement_accepted: true
            });

            if (participantError) {
                console.error("Error adding participant:", participantError);
                notify({ type: "error", message: "Failed to Accept Invitation." });
                return;
            }

            try {
                await collabRoomAcceptedNotificationWithEmail(
                    profileId,
                    profile.firstName!,
                    updatedInvitation.sender,
                    sender?.email,
                    thinktank?.title
                );
            } catch (emailError) {
                console.error("Failed to send acceptance email:", emailError);
                notify({ type: "warning", message: "Failed to send acceptance email." });
            }

            notify({ type: "success", message: "Invitation Accepted! Redirecting..." });
            router.push(`${window.location.origin}/think-tank/room/${updatedInvitation.action}`);
            setInvitationStatus(updatedInvitation.status);

        } catch (error) {
            console.error("Unexpected Error:", error);
            notify({ type: "error", message: "Something went wrong while accepting." });
        } finally {
            setLoadingAcceptInvite(false);
        }
    };

    const handleDeclineInvite = async (inviteId: string, profileId: string) => {
        try {
            const { data: invitation, error: invitationError } = await supabase
                .from("invitation")
                .update({ status: "Declined" })
                .eq("id", inviteId)
                .eq("receiver_id", profileId)
                .select("status")
                .single()

            if (invitationError) {
                console.error("Error Rejecting invitation: ", invitationError);
                return;
            }
            setInvitationStatus(invitation.status)

        } catch (error) {
            console.error("Unexpected Error: ", error);
        }
    }

    useEffect(() => {
        if (invitationId) {
            fetchInvitation(invitationId);
        }
    }, [invitationId]);

    if (loadingData) {
        return (
            <div className={styles.main}>
                <Spin size='large' />
            </div>
        )
    }

    if (!profile.profileId) {
        return null;
    }

    return (
        <div className={styles.main}>
            <div className={styles.invitationContainer}>
                {inviteData ? (
                    <>
                        <div className={styles.header}>
                            <h1>You're Invited</h1>
                            <p className={styles.subtitle}>To join the Collab Room</p>
                        </div>

                        <div className={styles.content}>
                            <div className={styles.invitationDetails}>
                                <DetailItem icon="👤" label="From" value={`${inviteData?.sender?.firstName ?? ''} ${inviteData?.sender?.lastName ?? ''}`} />
                                <DetailItem icon="🎉" label="Collab Room" value={inviteData?.thinktank?.title ?? 'N/A'} />
                                <DetailItem icon="📧" label="Sent On" value={dayjs(inviteData.invitation.created_at).format('MMM DD, YYYY h:mm:ss A')} />
                            </div>

                            <div className={styles.actionButtons}>
                                <Button onClick={() => handleAcceptInvite(invitationId, profile.profileId!)} disabled={invitationStatus !== 'Pending'} variant='solid' color='cyan' className={`${styles.btn} ${styles.btnAccept}`} loading={loadingAcceptInvite}>
                                    ✓ {invitationStatus === 'Pending' ? "Accept" : invitationStatus}
                                </Button>
                                <Button onClick={() => handleDeclineInvite(invitationId, profile.profileId!)} disabled={invitationStatus !== 'Pending'} variant='solid' color='pink' className={`${styles.btn} ${styles.btnDecline}`}>
                                    ✗ Decline
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <Empty description="No Invitation" />
                )}
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value, isHTML = false }: any) => (
    <div className={styles.detailItem}>
        <div className={styles.detailIcon}>{icon}</div>
        <div className={styles.detailContent}>
            <div className={styles.detailLabel}>{label}</div>
            {isHTML ? (
                <div className={styles.detailValue} dangerouslySetInnerHTML={{ __html: value }} />
            ) : (
                <div className={styles.detailValue}>{value}</div>
            )}
        </div>
    </div>
);

export default InvitationPage;