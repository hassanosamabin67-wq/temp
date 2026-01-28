'use client'
import { FC, useEffect, useState } from 'react';
import { LuUsers, LuClock } from "react-icons/lu";
import { MdOutlineCalendarToday } from "react-icons/md";
import { IoMdShare } from "react-icons/io";
import { LuHeart } from "react-icons/lu";
import styles from "./style.module.css";
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import userImg from '@/public/assets/img/userImg.webp'
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Image from 'next/image';
import { Button, Empty, Form, InputNumber, Modal, Skeleton, Typography } from 'antd';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import { FaXTwitter, FaSquareThreads } from "react-icons/fa6";
import { IoMail } from "react-icons/io5";
import { FaFacebook } from "react-icons/fa";
import StripePayment from '@/Components/StripePayment';
import { collabRoomEventStartUpdate } from '@/lib/collabRoomNotifications';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

const EventDetailPage: FC<{ eventId: string }> = ({ eventId }) => {
    const [donationAmount, setDonationAmount] = useState<any>(null);
    const [selectedAmount, setSelectedAmount] = useState<any>(null);
    const [eventData, setEventData] = useState<any>(null)
    const [loadingData, setLoadingData] = useState(false);
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const getYouTubeThumbnail = (url: string) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=)([^&]+)/);
        return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    }

    const getParticipants = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('think_tank_participants')
                .select('*')
                .eq('think_tank_id', id)

            if (error) {
                console.error('Error fetching think tank:', error);
                return null;
            }

            const filtered = data?.filter(Boolean) || [];
            const participant = filtered.find(p => p.participant_id === profile.profileId);

            // if (!participant || !profile) {
            //     router.push('/login');
            //     return;
            // }

            // if (participant.status === 'Pending') {
            //     notify({ type: "warning", message: `Your request is under review. Please wait for approval by the host.` });
            //     router.push('/think-tank');
            //     return;
            // }
            return filtered
            // setParticipants(filtered);
            // setValidUser(true);

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    const handleFetchEventData = async (eventId: string) => {
        try {
            setLoadingData(true)
            const { data, error } = await supabase
                .from('think_tank_events')
                .select("*")
                .eq("id", eventId)
                .single()

            if (error) {
                console.error("Error Fetching Event data: ", error);
                return;
            }

            const now = Date.now();
            const eventTime = new Date(data.event_start_time).getTime();
            const isTimeReached = eventTime <= now;
            const eventStartDateTime = new Date(`${data.event_date}T${data.event_start_time}`);
            // const isTimeReached = new Date() >= eventStartDateTime;
            const isEventEnded = data.status === 'end'
            const participants = Array.isArray(data.participants) ? data.participants : [];
            const currentParticipant = participants?.find((p: any) => p.id === profile.profileId);
            const hasPaid = currentParticipant?.payment === "Paid";
            const spotsFilled = data.slots === (data.participants.length - 1);
            const eventEnded = hasPaid && isEventEnded;

            const { data: hostData, error: hostFetchError } = await supabase
                .from('users')
                .select("firstName,lastName,profileImage,title")
                .eq("userId", data.host)
                .single()

            if (hostFetchError) {
                console.error("Error Fetching Host data: ", error);
                return;
            }

            const tz = dayjs(data.event_date).format('Z');

            const enrichedData = {
                id: data.id,
                title: data.event_name,
                date: dayjs(data.event_date).format('MMMM D YYYY'),
                time: `${dayjs(data.event_start_time).format('h:mm A')} - ${dayjs(data.event_end_time).format('h:mm A')}`,
                event_start_time: data.event_start_time,
                roomId: data.think_tank_id,
                host: data.host,
                timezone: `GMT${tz} (${data.country})`,
                pricing: {
                    type: data.type,
                    amount: data.price,
                    currency: "USD",
                    suggestedAmounts: [10, 25, 50, 100]
                },
                description: data.description,
                media: {
                    type: data.media_type,
                    url: data.media_file,
                    hasPreview: true
                },
                attendeeCount: data.participants.length - 1,
                maxAttendees: data.slots,
                organizer: {
                    name: `${hostData.firstName} ${hostData.lastName}`,
                    title: hostData.title || "",
                    avatar: hostData.profileImage || userImg
                },
                isPast: false,
                participants: data.participants,
                joinStatus: {
                    hasPaid,
                    isEventEnded,
                    isTimeReached,
                    spotsFilled,
                    eventEnded,
                    currentParticipant,
                    price: data.price,
                    isHost: data.host
                },
                youtube_url: data.youtube_url
            }
            setEventData(enrichedData)

        } catch (error) {
            console.error("Unexpected Error: ", error)
        } finally {
            setLoadingData(false)
        }
    }

    const getCTAState = (pricing: any, joinStatus: any) => {
        const { isHost, isTimeReached, currentParticipant, price, hasPaid, spotsFilled, eventEnded, isEventEnded } = joinStatus;
        if (isEventEnded) return { text: 'Event Ended', disabled: true };
        if (isHost === profile.profileId) {
            return { text: "Start Event", disabled: !isTimeReached };
        } else {
            if ((price > 0 && !hasPaid) && isTimeReached) return { text: "Time Out", disabled: true }
            else if (!hasPaid && spotsFilled) return { text: "Slots Filled", disabled: true }
            else if (eventEnded) return { text: "Event Ended", disabled: true }
            else if (!currentParticipant && price > 0) return { text: `Purchase Ticket - $${pricing.amount} ${pricing.currency}`, disabled: false };
            else if (hasPaid && isTimeReached) return { text: 'Join' }
            else if (hasPaid && !isTimeReached) return { text: "You’re Already Registered", disabled: true }
        }

        switch (pricing.type) {
            case 'Free':
                return { text: 'Join Event - Free', disabled: false };
            case 'Direct Payment':
                return { text: `Purchase Ticket - $${pricing.amount} ${pricing.currency}`, disabled: false };
            case 'Donation based':
                const amount = selectedAmount || parseFloat(donationAmount) || 0;
                return {
                    text: amount > 0 ? `Donate $${amount} & Join` : 'Enter Amount to Join',
                    disabled: amount <= 0
                };
            default:
                return { text: '', disabled: true };
        }
    };

    useEffect(() => {
        if (!eventId) return
        handleFetchEventData(eventId)
    }, [])

    const handleJoinEvent = async (id: string) => {
        try {
            setJoinLoading(true);

            const { data: eventData, error } = await supabase
                .from("think_tank_events")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !eventData) {
                console.error("Error fetching event:", error);
                notify({ type: "error", message: "Could not fetch event" });
                return;
            }

            const participants = eventData.participants || [];
            const current = participants.find((p: any) => p.id === profile.profileId);
            const hasPaid = current?.payment === "Paid" || eventData.type === "Free";
            const isDonationBased = eventData.type === 'Donation based' && eventData.price == 0;

            const eventStart = new Date(eventData.event_start_time).getTime();
            const now = Date.now();
            const twoHoursAfter = eventStart + 2 * 60 * 60 * 1000;
            const isTimeReached = eventStart <= now;
            const isTooLate = now > twoHoursAfter;
            const isHost = eventData.host === profile.profileId;

            let sessionId: string | undefined;
            const { data: liveSession } = await supabase
                .from("Live")
                .select("id")
                .eq("event_id", id)
                .maybeSingle();

            if (liveSession) {
                sessionId = liveSession.id;
            }

            // ----- HOST FLOW -----
            if (isHost) {
                if (!isTimeReached) {
                    notify({ type: "info", message: "You can start only when the event time is reached." });
                    return;
                }
                if (isTooLate) {
                    notify({ type: "warning", message: "You can no longer start this event. The scheduled time has passed." });
                    return;
                }

                // Create live session if not already created
                if (!sessionId) {
                    const livePayload = {
                        host: eventData.host,
                        think_tank_id: eventData.roomId,
                        event_id: id,
                        status: "live",
                        participants: [{ id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "host", payment: "Paid" }]
                    };

                    const { data: newLive, error: createError } = await supabase
                        .from("Live")
                        .insert([livePayload])
                        .select("id")
                        .single();

                    if (createError) {
                        console.error("Error creating live session:", createError);
                        notify({ type: "error", message: "Unable to start session." });
                        return;
                    }

                    sessionId = newLive.id;
                }

                // Update event to live
                const { data: updatedEventData, error: updateError } = await supabase
                    .from("think_tank_events")
                    .update({ status: "live" })
                    .eq("id", id)
                    .select("*")
                    .single()

                if (updateError) {
                    console.error("Error updating event status:", updateError)
                }

                const participant = await getParticipants(updatedEventData.think_tank_id);
                const paidParticipants = Array.isArray(updatedEventData.participants) ? updatedEventData.participants : [];

                for (const roomParticipant of participant!) {
                    const participantId = roomParticipant.participant_id;

                    if (participantId === eventData.host) continue;

                    const isPaid = paidParticipants.some((p: any) => p.id === participantId);

                    if (updatedEventData?.type === 'Free' || isPaid) {
                        try {
                            await collabRoomEventStartUpdate(
                                eventData.host,
                                participantId,
                                updatedEventData.event_name,
                                updatedEventData.think_tank_id
                            );
                        } catch (err) {
                            console.error(`Failed to send notification to ${participantId}:`, err);
                        }
                    }
                }
                window.open(`/channel/video/${sessionId}?session=${id}`, "_blank");
                return;
            }

            // ----- PARTICIPANT FLOW -----
            if (!current && isDonationBased) {
                setShowPaymentModal(true);
                return;
            }

            if (!hasPaid) {
                setShowPaymentModal(true);
                return;
            }

            if (!isTimeReached) {
                notify({ type: "info", message: "Event has not started yet. Please wait." });
                return;
            }

            if (eventData.status !== "live") {
                notify({ type: "info", message: "Event has not started yet. Please wait." });
                return;
            }

            if (sessionId) {
                window.open(`/channel/video/${sessionId}?session=${id}`, "_blank");
            } else {
                notify({ type: "error", message: "Unable to join. Session not found." });
            }

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setJoinLoading(false);
        }
    };

    const handleInvite = (id: any) => {
        const inviteUrl = `${window.location.origin}/event/${id}`;
        navigator.clipboard.writeText(inviteUrl)
            .then(() => {
                notify({
                    type: "success",
                    message: "Invite link copied to clipboard!",
                });
            })
            .catch((err) => {
                console.error("Failed to copy invite link:", err);
                notify({
                    type: "error",
                    message: "Failed to copy invite link.",
                });
            });
    };

    const eventInvite = (url: string) => {
        window.open(url, "_blank");
        return;
    }

    const renderPricingSection = () => {
        const { pricing } = eventData;

        switch (pricing.type) {
            case 'Free':
                return (
                    <div className={styles.pricingSection}>
                        <div className={styles.priceHeader}>
                            <span className={styles.freeBadge}>Free Entry</span>
                        </div>
                        <p className={styles.pricingDescription}>
                            This event is completely free to attend. Simply register to secure your spot.
                        </p>
                    </div>
                );

            case 'Direct Payment':
                return (
                    <div className={styles.pricingSection}>
                        <div className={styles.priceHeader}>
                            <span className={styles.priceAmount}>${pricing.amount} {pricing.currency}</span>
                            <span className={styles.priceLabel}>per person</span>
                        </div>
                        <p className={styles.pricingDescription}>
                            Secure your spot with a one-time payment. Includes all workshop materials and resources.
                        </p>
                    </div>
                );

            case 'Donation based':
                return (
                    <div className={styles.pricingSection}>
                        <div className={styles.priceHeader}>
                            <span className={styles.donationBadge}>Pay What You Want</span>
                        </div>
                        <p className={styles.pricingDescription}>
                            This event operates on a pay-what-you-can model. Suggested donation: ${pricing.amount} {pricing.currency}
                        </p>

                        <div style={{
                            marginTop: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <span className={styles.label}>Quick amounts:</span>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                }}>
                                    {pricing.suggestedAmounts.map((amount: number) => (
                                        <button
                                            key={amount}
                                            onClick={() => setSelectedAmount(amount)}
                                            disabled={eventData.pricing.amount > 0}
                                            className={`${styles.amountButton} ${selectedAmount === amount ? styles.selectedAmountButton : ''
                                                }`}
                                        >
                                            ${amount}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <span className={styles.label}>Custom amount:</span>
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '12px',
                                        color: '#6b7280',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        zIndex: 1
                                    }}>$</span>
                                    <input
                                        type="number"
                                        value={donationAmount}
                                        onChange={(e) => {
                                            setDonationAmount(e.target.value);
                                            setSelectedAmount(null);
                                        }}
                                        disabled={eventData.pricing.amount > 0}
                                        placeholder="Enter amount"
                                        className={styles.donationInput}
                                        min="1"
                                        step="1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderCallToAction = () => {
        const { pricing, joinStatus } = eventData;
        const { text, disabled } = getCTAState(pricing, joinStatus);

        return (
            <Button
                onClick={() => handleJoinEvent(eventId)}
                className={styles.primaryButton}
                variant="solid"
                color="blue"
                disabled={disabled}
                loading={joinLoading}
            >
                {text}
            </Button>
        );
    };

    const renderMedia = () => {
        const media = eventData.media;

        if (eventData.youtube_url) {
            return (
                <Image
                    width={500}
                    height={500}
                    src={eventData.youtube_url ? getYouTubeThumbnail(eventData.youtube_url) : eventData.url}
                    alt={eventData.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            )
        }

        if (!media || !media.url) {
            return (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    color: '#fff',
                    fontWeight: 'bold'
                }}>
                    No Preview Available
                </div>
            );
        }

        const { type, url } = media;

        switch (type) {
            case 'video':
                return (
                    <video controls style={{ width: "100%" }}>
                        <source src={url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                );
            case 'image':
                return (
                    <Image
                        width={500}
                        height={500}
                        src={url}
                        alt={eventData.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                );
            default:
                return (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        fontWeight: 'bold'
                    }}>
                        No Preview Available
                    </div>
                );
        }
    };

    if (loadingData) {
        return (
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    <div className={styles.leftColumn}><Skeleton active /></div>
                    <div className={styles.rightColumn}><Skeleton active /></div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {/* Main Content */}
            {eventData ? (
                <>
                    <div className={styles.mainContent}>
                        {/* Left Column - Main Content */}
                        <div className={styles.leftColumn}>
                            {/* Media Section */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                backgroundColor: '#000000',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                marginBottom: '32px',
                                position: 'relative'
                            }}>
                                {renderMedia()}
                            </div>

                            {/* Title and Category */}
                            <div className={styles.titleSection}>
                                <h1 className={styles.title}>
                                    {eventData.title}
                                </h1>
                            </div>

                            {/* Meta Information */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '24px',
                                marginBottom: '32px',
                                padding: '20px',
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div className={styles.metaItem}>
                                    <MdOutlineCalendarToday size={20} />
                                    <span>{eventData.date}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <LuClock size={20} />
                                    <span>{eventData.time} {eventData.timezone}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <LuUsers size={20} />
                                    <span>{eventData.attendeeCount} / {eventData.maxAttendees} attending</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className={styles.description}>
                                <h2 className={styles.descriptionTitle}>About This Event</h2>
                                <div className={styles.descriptionText}>
                                    {eventData.description}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className={styles.rightColumn}>
                            <div className={styles.sidebar}>
                                {/* Pricing Section */}
                                {renderPricingSection()}

                                {/* Call to Action */}
                                {renderCallToAction()}

                                {/* Secondary Actions */}
                                <button
                                    className={styles.secondaryButton}
                                    onClick={() => setShowInviteModal(true)}
                                >
                                    <IoMdShare />
                                    Share Event
                                </button>

                                {/* <button
                                className={styles.secondaryButton}
                            >
                            <LuHeart />
                            Save for Later
                            </button> */}

                                {/* Event Stats */}
                                <div className={styles.eventStats}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Organized by</span>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <span style={{ color: "#F9B100" }}>K.</span>
                                            <span className={styles.statValue}>{eventData.organizer.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Modal
                        open={showPaymentModal}
                        onCancel={() => setShowPaymentModal(false)}
                        centered
                        width={600}
                        footer={null}
                    >
                        <StripePayment
                            profile={profile}
                            eventId={eventId}
                            eventHost={eventData.host}
                            paymentAmount={selectedAmount || donationAmount || eventData.pricing.amount || 0}
                            setShowHireModal={setShowPaymentModal}
                        />
                    </Modal >

                    <Modal
                        title={
                            <Title level={2} style={{ marginBottom: 10 }}>
                                Invite Others
                            </Title>
                        }
                        open={showInviteModal}
                        onCancel={() => setShowInviteModal(false)}
                        footer={null}
                        width={600}
                        centered
                    >
                        <div>
                            <Button onClick={() => handleInvite(eventId)}>Copy Link</Button>
                            <div style={{ margin: "20px 0" }}>
                                <span className={styles.shareHeading}>Share</span>
                                <div className={styles.scDiv}>
                                    <span className={`${styles.scIcon} ${styles.fbIcon}`} onClick={() => eventInvite('https://www.facebook.com')}><FaFacebook /></span>
                                    <span className={styles.scIcon} onClick={() => eventInvite('https://x.com')}><FaXTwitter /></span>
                                    <span className={styles.scIcon} onClick={() => eventInvite('https://www.threads.com')}><FaSquareThreads /></span>
                                    <span className={`${styles.scIcon} ${styles.mailIcon}`} onClick={() => eventInvite('https://mail.google.com')}><IoMail /></span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                </>
            ) : (
                <Empty description="No Event" />
            )}
        </div>
    );
};

export default EventDetailPage;