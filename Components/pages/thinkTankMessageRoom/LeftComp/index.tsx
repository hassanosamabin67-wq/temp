"use client"
import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import userImage from "@/public/assets/img/userImg.webp"
import Image from 'next/image'
import { Button, Input, Dropdown, Popover, Skeleton, Form, Typography, Modal } from 'antd'
import { useAppSelector } from '@/store'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/config/supabase'
import { useNotification } from '@/Components/custom/custom-notification'
import styles from './style.module.css'
import { CiMenuKebab } from "react-icons/ci";
import dayjs from 'dayjs'
import Link from 'next/link'
import NdaModal from '@/Components/NdaModal'
import { collabRoomRequestAccept, createCollabRoomInviteNotificationWithEmail } from '@/lib/collabRoomNotifications'
import { getBrandedNameParts } from '@/lib/brandName'
import CollabRoomGridRow from '@/Components/UIComponents/CollabRoomGridRow'
import ThemedModal from '@/Components/UIComponents/ThemedModal'
import { getTheme } from '@/lib/roomThemes'
import { HiOutlineUserPlus } from 'react-icons/hi2'

const { Title } = Typography;
const LeftComponent = ({ thinkTank, channels, setChannels, participant, roomId, onOpenConversation, setCenterView, setParticipants }: any) => {
    const roomType = thinkTank?.room_type;
    const theme = getTheme(roomType);
    const [showInput, setShowInput] = useState(false)
    const [newChannel, setNewChannel] = useState("")
    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const { notify } = useNotification();
    const searchParams = useSearchParams();
    const keyword = searchParams.get("channel")
    const otherUser = searchParams.get("ch")
    const [loading, setLoading] = useState(false);
    const currentParticipant = participant.find((p: any) => p.participant_id === profile.profileId);
    const forEvent = currentParticipant?.forEvent;
    const isAgreementAccepted = currentParticipant?.is_agreement_accepted;
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [joinFreeModal, setJoinFreeModal] = useState(false);
    const [joiningTank, setJoiningTank] = useState(false);
    const [joiningLoading, setJoiningLoading] = useState(false);
    const [mailSendLoading, setMailSendLoading] = useState(false);
    const [checked, setChecked] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [donationAmount, setDonationAmount] = useState<number>(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isDonationBased, setIsDonationBased] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [thinkTankHost, setThinkTankHost] = useState<any>({});
    const [form] = Form.useForm();

    const getAllChannels = async (think_tank_id: string) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("channels")
                .select("*")
                .eq("think_tank_id", think_tank_id)

            if (!error && data) {
                setChannels(data)
            }
        } catch (err) {
            console.error("Unexpected Error: ", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddChannel = async (think_tank_id: string) => {
        const trimmedName = newChannel.trim();
        if (!trimmedName) return;

        try {
            const { data: existingChannel, error: fetchError } = await supabase
                .from("channels")
                .select("*")
                .eq("think_tank_id", think_tank_id)
                .eq("name", trimmedName)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Fetch failed:', fetchError);
                return;
            }

            if (existingChannel) {
                notify({
                    type: "warning",
                    message: `A channel named "${existingChannel.name}" already exists.`,
                });
                return;
            }

            const { data, error: insertError } = await supabase
                .from("channels")
                .insert([{ name: trimmedName, think_tank_id: think_tank_id }])
                .select()
                .single()

            if (insertError) {
                console.error('Insert failed:', insertError);
                return;
            }

            const addChannel = [...channels, data]
            setChannels(addChannel)
            setNewChannel("")
            setShowInput(false)
            const channelName = data.name?.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
            router.push(`/think-tank/room/${roomId}?channel=${channelName}&rn=${data.id}`);

        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    }

    const handleOpenConversation = async (participantId: string, roomId: string) => {
        onOpenConversation(participantId, roomId);
        setCenterView('chat')
    };

    const handleChannelClick = (channel: string, id: string) => {
        const channelName = channel?.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
        setCenterView('chat')
        router.push(`/think-tank/room/${roomId}?channel=${channelName}&rn=${id}`);
    }

    const handleAccept = async (participantId: string, thinkTankId: string) => {
        try {
            const { error } = await supabase.from('think_tank_participants')
                .update({ status: 'Accepted' })
                .eq('participant_id', participantId)
                .eq('think_tank_id', thinkTankId);
            if (error) {
                console.error("Error accepting the request ", error)
                return;
            }

            try {
                await collabRoomRequestAccept(profile.profileId!, participantId, thinkTank.title)
            } catch (error) {
                console.error("Error sending accept notification:", error)
            }

        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    }

    const handleInvite = async () => {
        try {
            setMailSendLoading(true)
            const values = await form.validateFields();
            const email = values.email;

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("userId")
                .eq("email", email)
                .maybeSingle();

            if (userError || !userData) {
                notify({ type: "error", message: "User not found with this email." });
                console.error("User lookup failed: ", userError);
                return;
            }

            const receiverId = userData.userId;

            const { data, error } = await supabase
                .from("invitation")
                .insert({
                    type: "Collab Room",
                    sender: profile.profileId,
                    receiver: email,
                    receiver_id: receiverId,
                    action: roomId,
                    status: "Pending"
                })
                .select("id")
                .single();

            if (error) {
                notify({ type: "error", message: "Failed to send invite link." });
                console.error("Error Inviting User: ", error);
                return;
            }

            try {
                await createCollabRoomInviteNotificationWithEmail(
                    profile.profileId!,
                    profile.firstName!,
                    receiverId,
                    data.id,
                    email,
                    roomId
                );

                notify({ type: "success", message: "Invitation sent successfully!" });
                setShowInviteModal(false);
                form.resetFields();
            } catch (emailError) {
                console.error("Error sending email:", emailError);
                notify({ type: "warning", message: "Invitation created but email notification failed to send." });
            }

        } catch (error) {
            console.error("Unexpected Error: ", error);
            notify({ type: "error", message: "An unexpected error occurred." });
        } finally {
            setMailSendLoading(false)
        }
    };

    const handleRemoveParticipant = async (participantId: string, thinkTankId: string) => {
        try {
            const { error: participantError } = await supabase
                .from('think_tank_participants')
                .delete()
                .eq('participant_id', participantId)
                .eq('think_tank_id', thinkTankId);

            if (participantError) {
                console.error("Error removing participant:", participantError);
                notify({ type: "error", message: "Failed to remove participant." });
                return;
            }

            setParticipants((prev: any[]) => prev.filter(p => p.participant_id !== participantId));
            notify({ type: "success", message: "Participant removed successfully." });

        } catch (err) {
            console.error("Unexpected error:", err);
            notify({ type: "error", message: "An unexpected error occurred." });
        }
    };

    const handleJoinRoom = async (id: string, profileId: string | any, thinkTank: any) => {
        try {
            setJoiningLoading(true)

            const { data: existingParticipant, error: fetchError } = await supabase
                .from('think_tank_participants')
                .select('*')
                .eq('participant_id', profileId)
                .eq('think_tank_id', id)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Fetch failed:', fetchError);
                return;
            }

            const { data: hostData, error: hostError } = await supabase
                .from('users')
                .select('userId, firstName, lastName, profileImage')
                .eq('userId', thinkTank.host)
                .single()

            if (hostError) {
                console.error('Error fetching host:', hostError)
                return
            }

            const isOpen = thinkTank.accesstype === "Open";
            const requiresPayment = !!thinkTank.price;
            const hasPaid = existingParticipant?.payment === "Paid";
            const donationBasedRoom = thinkTank.pricingtype === 'Donation-Based';

            setPaymentAmount(thinkTank.price);
            setIsDonationBased(donationBasedRoom);
            setDonationAmount(0);
            setThinkTankHost(hostData)

            if (thinkTank.accesstype === 'Limited' && thinkTank.participant_limit) {
                const { data: participants, error: participantError } = await supabase
                    .from('think_tank_participants')
                    .select('*')
                    .eq('think_tank_id', id)
                    .eq('status', 'Accepted');

                if (participantError) {
                    console.error('Participant fetch failed:', participantError);
                    return;
                }

                if (participants.length >= thinkTank.participant_limit) {
                    notify({ type: 'error', message: 'Tank is full. You cannot join.' });
                    return;
                }
            }

            if (existingParticipant) {
                if (requiresPayment && !hasPaid) {
                    setShowAgreementModal(true);
                    return;
                }

                if (existingParticipant.status === 'Pending') {
                    notify({ type: 'info', message: 'Your request is under review. Please wait for the host to approve it.' });
                    return;
                }

                if (isOpen || !requiresPayment) {
                    setJoinFreeModal(true);
                    return;
                }

                router.refresh();
                return;
            }

        } catch (err) {
            console.error("Unexpected Error: ", err)
        } finally {
            setJoiningLoading(false)
        }
    }

    const showFreeModal = async (id: any, profileId: any, thinkTank: any) => {
        try {
            setJoiningTank(true);

            const isOpen = thinkTank?.accesstype === "Open";
            const newStatus = isOpen ? "Accepted" : "Pending";

            const { error: updateError } = await supabase.from('think_tank_participants')
                .update({ status: newStatus, is_agreement_accepted: true, forEvent: false })
                .eq("participant_id", profileId)
                .eq("think_tank_id", id)

            if (updateError) {
                console.error('Update failed:', updateError);
                notify({ type: 'error', message: 'Failed to join. Please try again.' });
                return;
            }

            if (isOpen) {
                setJoinFreeModal(false);
                router.refresh();
            } else {
                setJoinFreeModal(false);
                notify({
                    type: 'success',
                    message: 'Your request to join the Think Tank has been send. Please wait for your approval',
                });
                return;
            }
            setJoinFreeModal(false);

        } catch (err) {
            console.error("Unexpected error: ", err);
        } finally {
            setJoiningTank(false)
        }
    }

    const getMaxSteps = () => {
        if (!isDonationBased) return 1;
        return donationAmount > 0 ? 2 : 1;
    };

    const next = async () => {
        try {
            if (currentStep === 0 && !checked) {
                notify({ type: "error", message: "Please accept the License Agreement before proceeding." });
                return;
            }

            const maxSteps = getMaxSteps();
            if (currentStep === 1 && isDonationBased && donationAmount === 0) {
                await showFreeModal(roomId, profile.profileId, thinkTank);
                setShowAgreementModal(false);
                return;
            }

            if (currentStep < maxSteps) {
                setCurrentStep(currentStep + 1);
            }
        } catch (err) {
            console.log("Validation error", err);
        }
    };

    const prev = () => setCurrentStep(currentStep - 1);

    useEffect(() => {
        if (showAgreementModal || joinFreeModal) {
            setChecked(false);
        }
    }, [showAgreementModal, joinFreeModal]);

    useEffect(() => {
        getAllChannels(roomId)
    }, [])

    if (loading) {
        return (
            <div className={styles.leftContentLoading}>
                <Skeleton active />
            </div>
        )
    }

    if (forEvent && !isAgreementAccepted) {
        return (
            <>
                <NdaModal
                    open={showAgreementModal}
                    onClose={() => setShowAgreementModal(false)}
                    profile={profile}
                    thinkTankHost={thinkTankHost}
                    checked={checked}
                    setChecked={setChecked}
                    showStepper={true}
                    step={currentStep}
                    onNextStep={next}
                    onPrevStep={prev}
                    paymentAmount={paymentAmount}
                    selectedTankId={roomId}
                    isDonationBased={isDonationBased}
                    donationAmount={donationAmount}
                    setDonationAmount={setDonationAmount}
                    fromInvite={true}
                />

                <NdaModal
                    open={joinFreeModal}
                    onClose={() => setJoinFreeModal(false)}
                    profile={profile}
                    thinkTankHost={thinkTankHost}
                    checked={checked}
                    setChecked={setChecked}
                    showJoinButton={true}
                    loading={joiningTank}
                    onConfirm={() => showFreeModal(roomId, profile.profileId, thinkTank)}
                    fromInvite={true}
                />

                <div className={styles.leftContent}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 40 }}>
                        <span style={{ fontSize: 20, fontWeight: "500", textAlign: "center" }} >Get Full Access To Collab Room</span>
                        <Button loading={joiningLoading} onClick={() => handleJoinRoom(roomId, profile.profileId, thinkTank)}>Buy Now</Button>
                    </div>
                </div>
            </>

        )
    }

    return (
        <>
            <ThemedModal
                roomType={roomType}
                themedTitle={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                            <HiOutlineUserPlus size={20} />
                        </span>
                        <span>Send Collab Room Invite</span>
                    </div>
                }
                open={showInviteModal}
                onCancel={() => setShowInviteModal(false)}
                width={600}
                footer={null}
            >
                <Form form={form} layout="vertical">
                    <Form.Item style={{ width: "100%" }} name="email" label="Email Address">
                        <Input type='email' placeholder='Enter Receiver Email' />
                    </Form.Item>
                </Form>
                <div style={{ width: "100%" }}>
                    <Button type="primary" loading={mailSendLoading} style={{ width: "100%" }} onClick={handleInvite}>Send Invitation</Button>
                </div>
            </ThemedModal>
            <CollabRoomGridRow>
                <span className={styles.titleHeading}><Link className={styles.titleLink} href={`/think-tank/room/${roomId}`}>{thinkTank?.title || ""}</Link></span>
                <div className={styles.leftContent}>
                    <div>
                        <span className={styles.subHeading}>CHANNELS</span>
                        <ul className={styles.channelUl}>
                            {channels.map((channel: any) => (
                                <li
                                    key={channel.id}
                                    className={`${styles.channels} ${keyword && keyword?.replace("-", ' ') === channel.name ? styles.activeChannel : ''}`}
                                    onClick={() => handleChannelClick(channel.name, channel.id)}
                                >
                                    <span># {channel.name}</span>
                                </li>
                            ))}
                        </ul>
                        <div className={styles.addTopicDiv}>
                            {showInput ? (
                                <Input
                                    type="text"
                                    className={styles.channelInput}
                                    value={newChannel}
                                    onChange={(e) => setNewChannel(e.target.value)}
                                    onPressEnter={() => handleAddChannel(roomId)}
                                    autoFocus
                                    placeholder="New channel name"
                                    onBlur={() => {
                                        setShowInput(false)
                                        setNewChannel("")
                                    }}
                                />
                            ) : (
                                <span className={styles.addTopicBtn} onClick={() => setShowInput(true)}>
                                    <PlusOutlined className={styles.plusIcon} /> Add Topic
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <span className={styles.subHeading}>PARTICIPANTS</span>
                        <ul className={styles.participantsDisplay}>
                            {participant && participant.filter((data: any) => data.users?.userId !== profile.profileId).map((data: any) => {
                                const isPending = data.status === "Pending";
                                const isHost = profile.profileId === thinkTank?.host;
                                const isDisabled = isPending && !isHost;
                                const formattedDate = dayjs(data.created_at).format('MMM D, YYYY');
                                const participantForEvent = data.forEvent;
                                const { prefix, name } = getBrandedNameParts(data.users?.firstName, data.users?.lastName)

                                return (
                                    <Popover key={data.users?.userId} content={<div>{`${prefix}${name} - Joined ${formattedDate}`}</div>}>
                                        <li className={`${styles.participants} ${data.users?.userId == otherUser ? styles.activeChannel : ""} ${isDisabled ? styles.disabledParticipant : ""}`} onClick={() => {
                                            if (!isDisabled) {
                                                handleOpenConversation(data.users?.userId, roomId)
                                            }
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <Image
                                                    src={userImage}
                                                    alt="user image"
                                                    width={200}
                                                    height={200}
                                                    className={styles.userImage}
                                                />
                                                <span>
                                                    <span style={{ color: "#F9B100" }}>{prefix}</span>
                                                    {name}
                                                </span>
                                            </div>
                                            {participantForEvent && (
                                                <Button type='default' danger className={styles.participantBlockBtn}>For Event</Button>
                                            )}
                                            {isHost && !isPending && (
                                                <Dropdown
                                                    menu={{
                                                        items: [
                                                            {
                                                                key: '1',
                                                                label: (
                                                                    <span onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveParticipant(data.users?.userId, roomId);
                                                                    }}>Remove</span>
                                                                ),
                                                            }]
                                                    }} trigger={['click']}>
                                                    <span><CiMenuKebab style={{ marginRight: 10 }} /></span>
                                                </Dropdown>
                                            )}
                                            {isHost && isPending && (
                                                <div className={styles.participantPermissionDiv}>
                                                    <Button className={styles.participantAcceptBtn} onClick={() => handleAccept(data.users?.userId, roomId)}>Accept</Button>
                                                    <Button type='default' danger className={styles.participantBlockBtn}>Block</Button>
                                                </div>
                                            )}
                                            {isPending && !isHost && (
                                                <span className="not-entered-text">Not Entered</span>
                                            )}
                                        </li>
                                    </Popover>
                                )
                            })}
                        </ul>
                        {thinkTank?.accesstype !== 'Open' && (<Button onClick={() => setShowInviteModal(true)} style={{ margin: '15px 0 0 15px', width: '90%' }} icon={<PlusOutlined />}>Invite Participants</Button>)}
                    </div>
                </div>
            </CollabRoomGridRow>
        </>
    )
}

export default LeftComponent