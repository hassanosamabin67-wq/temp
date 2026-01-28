'use client'

import React, { useEffect, useRef, useState } from 'react'
import './style.css'
import { useAppSelector } from '@/store';
import { Button, DatePicker, Dropdown, Empty, Form, Input, InputNumber, Modal, Select, Skeleton, TimePicker, Typography, Upload } from 'antd';
import { IoMdAdd } from "react-icons/io";
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import dayjs from 'dayjs';
import StripePayment from '@/Components/StripePayment';
import { fetchThinkTankEvents } from '@/utils/fetchEvents';
import Announcements from './Announcements';
import { FcInvite } from "react-icons/fc";
import { useEventRealTime } from '@/hooks/useEventRealTime';
import AddMusic from './AddMusic';
import { IoMdVolumeHigh, IoMdVolumeOff } from "react-icons/io";
import { FaXTwitter, FaSquareThreads } from "react-icons/fa6";
import { IoMail } from "react-icons/io5";
import { FaFacebook } from "react-icons/fa";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import EventCard from './EventCard';
import emptyImg from '@/public/assets/img/empty-image.svg'
import { RiFolderMusicFill } from 'react-icons/ri';
import { MdReadMore } from "react-icons/md";
import { collabRoomEventStartUpdate } from '@/lib/collabRoomNotifications';
import ThemedModal from '@/Components/UIComponents/ThemedModal';
import { getTheme } from '@/lib/roomThemes';
import { HiOutlineCalendarDays, HiOutlineShare, HiOutlineCreditCard } from 'react-icons/hi2';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

const RightComponent = ({ data, roomId, participant }: any) => {
    const profile = useAppSelector((state) => state.auth);
    const roomType = data?.room_type;
    const theme = getTheme(roomType);
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false);
    const [joinLoading, setJoinLoading] = useState<string | null>(null);
    const [events, setEvents] = useState<any>([])
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const isHost = profile.profileId === data?.host;
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [eventId, setEventId] = useState('');
    const selectedType = Form.useWatch("type", form);
    const [eventPrice, setEventPrice] = useState(null);
    const [userDonationAmount, setUserDonationAmount] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedEventType, setSelectedEventType] = useState<string | undefined>();
    const [now, setNow] = useState(Date.now());
    const [bgMusic, setBgMusic] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
    const currentParticipant = upcomingEvent && upcomingEvent.participants.find((p: any) => p.id === profile.profileId);
    const mediaType = Form.useWatch('media_type', form);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [amount, setAmount] = useState<number>(0)
    const presetAmounts = [1, 5, 10, 25, 50, 100];
    const [addEventLoading, setAddEventLoading] = useState(false);
    const [showMusicModal, setShowMusicModal] = useState(false);

    // Advertisement states
    const [ads, setAds] = useState<any[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [loadingAds, setLoadingAds] = useState(false);
    const [showAds, setShowAds] = useState(false);
    const adVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!events || events.length === 0) return;

        const nextEventTime = events
            .map((event: any) => new Date(event.event_start_time).getTime())
            .filter((time: any) => time > Date.now())
            .sort()[0];

        if (!nextEventTime) return;

        const interval = setInterval(() => {
            setNow(Date.now());

            if (Date.now() >= nextEventTime) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [events]);

    const showModal = () => setVisible(true);

    const handleCancel = () => {
        form.resetFields();
        setAttachedFile(null);
        setAmount(0);
        setVisible(false);
    }

    const getEvents = async (thinkTankId: string, isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true);
            }
            const data = await fetchThinkTankEvents(thinkTankId);

            const nowTime = Date.now();

            const upcomingEvents = data
                .filter(event => event.status !== 'end')
                .map(event => {
                    const eventTime = new Date(event.event_start_time).getTime();
                    const remaining = eventTime - nowTime;

                    return {
                        ...event,
                        eventTime,
                        remaining,
                    };
                })
                .sort((a, b) => a.eventTime - b.eventTime);

            setEvents(upcomingEvents);

            const nearEvent = upcomingEvents.find(
                event => event.remaining >= 0 && event.remaining <= 45 * 60 * 1000
            );

            if (nearEvent) {
                const prevEventId = upcomingEvent?.id;
                setUpcomingEvent(nearEvent);

                // Check if event is within 30 minutes to show ads
                const isWithin30Minutes = nearEvent.remaining >= 0 && nearEvent.remaining <= 30 * 60 * 1000;
                setShowAds(isWithin30Minutes);

                // Fetch ads ONLY when:
                // 1. Entering 30-minute window for the first time (ads.length === 0)
                // 2. OR when it's a different event (event changed)
                if (isWithin30Minutes && (ads.length === 0 || prevEventId !== nearEvent.id)) {
                    fetchAds(roomId, nearEvent.id);
                }
            } else {
                setUpcomingEvent(null);
                setShowAds(false);
                // Clear ads when no upcoming event
                if (ads.length > 0) {
                    setAds([]);
                }
            }

        } catch (err) {
            console.error("Right component fetching Error: ", err);
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    };

    /**
     * Fetch ads for lobby display
     * 
     * LOBBY ADS LOGIC:
     * - Ads are fetched ONCE when entering the 30-minute window
     * - ALL active ads for the room are shown (regardless of impression count)
     * - Ads continue showing for 30 days from approval date
     * - Even if an ad reaches 2000+ impressions, it keeps showing in lobby
     * - Cron job marks ads as 'expired' after 30 days (they disappear after that)
     * 
     * NOTE: 2000 impression cap is for REPLAY ads only, not lobby ads
     */
    const fetchAds = async (roomId: string, sessionId?: string) => {
        try {
            setLoadingAds(true);
            const url = sessionId
                ? `/api/ads/replay?room_id=${roomId}&session_id=${sessionId}`
                : `/api/ads/replay?room_id=${roomId}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.success && result?.ads) {
                setAds(result.ads);
                setCurrentAdIndex(0);
            } else {
                setAds([]);
            }
        } catch (err) {
            console.error('Error fetching ads:', err);
            setAds([]);
        } finally {
            setLoadingAds(false);
        }
    };

    const recordImpression = async (adId: string, sessionId?: string) => {
        try {
            await fetch('/api/ads/impression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: adId,
                    viewer_id: profile.profileId,
                    session_id: sessionId,
                    view_type: 'replay'
                })
            });
        } catch (err) {
            console.error('Error recording impression:', err);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Example: image validation
        if (mediaType === "image") {
            const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
            if (!isJpgOrPng) {
                notify({ type: "error", message: "Only JPG/PNG files are allowed!" });
                e.target.value = ""; // reset input
                return;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                notify({ type: "error", message: "Image must be smaller than 5MB!" });
                e.target.value = "";
                return;
            }
        }

        // Example: video validation
        if (mediaType === "video") {
            const isMp4 = file.type === "video/mp4";
            if (!isMp4) {
                notify({ type: "error", message: "Only MP4 videos are allowed!" });
                e.target.value = "";
                return;
            }
            const isLt200M = file.size / 1024 / 1024 < 200;
            if (!isLt200M) {
                notify({ type: "error", message: "Video must be smaller than 200MB!" });
                e.target.value = "";
                return;
            }
        }

        setAttachedFile(file);
    };

    const handleAddEvent = async () => {
        try {
            setAddEventLoading(true)
            await form.validateFields();
            const values = await form.getFieldsValue();

            // Validate media file is uploaded when image or video is selected
            if ((values.media_type === 'image' || values.media_type === 'video') && !attachedFile) {
                notify({
                    type: 'warning',
                    message: `Please upload ${values.media_type === 'image' ? 'an image' : 'a video'} file before adding the event.`
                });
                setAddEventLoading(false);
                return;
            }

            // Validate price is entered for paid events
            if (values.type !== 'Free' && (!amount || amount <= 0)) {
                notify({
                    type: 'warning',
                    message: 'Please enter a valid price for the event.'
                });
                setAddEventLoading(false);
                return;
            }

            const response = await fetch('https://ipinfo.io/json?token=9063eb09bb0e26');
            const ipData = await response.json();

            let fileUrl = null;

            if (attachedFile) {
                const fileName = `${Date.now()}_${attachedFile.name}`;
                const filePath = `room-thumbnail/${fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from("collab-room")
                    .upload(filePath, attachedFile);

                if (uploadError) {
                    console.error("File upload failed", uploadError);
                    notify({ type: 'error', message: 'Failed to upload image. Please try again.' });
                    return;
                }

                fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collab-room/${filePath}`;
            }

            const payload = {
                think_tank_id: roomId,
                event_name: values.event_name,
                description: values.description,
                event_date: values.event_date,
                event_start_time: values.event_start_time,
                event_end_time: values.event_end_time,
                price: amount,
                slots: values.slots,
                type: values.type,
                status: 'scheduled',
                host: profile.profileId,
                media_type: values.media_type,
                youtube_url: values.youtube_url || null,
                media_file: fileUrl,
                country: ipData.country || 'EST',
                participants: [{ id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "host", payment: "Paid" }]
            }

            const { data, error } = await supabase
                .from("think_tank_events")
                .insert([payload])
                .select("*")

            if (error) {
                console.error("Error Adding Event: ", error);
                notify({ type: "error", message: "Error Adding Event" })
                return;
            }

            form.resetFields();
            setAttachedFile(null);
            setAmount(0);
            setEvents((prev: any) => [...prev, ...data])
            setVisible(false)
            notify({ type: "success", message: "Event Added" })

        } catch (err) {
            console.error("Unexpected Error: ", err)
        } finally {
            setAddEventLoading(false)
        }
    }

    const handleJoinEvent = async (id: string) => {
        try {
            setJoinLoading(id);

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

            setSelectedEventType(eventData.type)
            setEventPrice(eventData.price)

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
                        think_tank_id: roomId,
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

                const paidParticipants = Array.isArray(updatedEventData.participants) ? updatedEventData.participants : [];

                for (const roomParticipant of participant) {
                    const participantId = roomParticipant.participant_id;

                    if (participantId === eventData.host) continue;

                    const isPaid = paidParticipants.some((p: any) => p.id === participantId);

                    if (updatedEventData?.type === 'Free' || isPaid) {
                        try {
                            await collabRoomEventStartUpdate(
                                eventData.host,
                                participantId,
                                updatedEventData.event_name,
                                roomId
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
                setEventId(id);
                console.log("DONATION BASED REACHED")
                return;
            }

            if (!hasPaid) {
                console.log("HAS PAID REACHED")
                setShowPaymentModal(true);
                setEventId(id);
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
            setJoinLoading(null);
        }
    };

    const releasePaymentForEvent = async (eventId: string, host: string) => {
        if (profile.profileId === host) return;

        try {
            const { data: liveData, error: liveError } = await supabase
                .from("Live")
                .select("id")
                .eq("event_id", eventId)
                .single();

            if (liveError || !liveData) {
                console.error("❌ Live session not found for event:", eventId);
                return;
            }

            const liveId = liveData.id;

            const { data: paymentRecord, error: paymentError } = await supabase
                .from("event_payments")
                .select("*")
                .eq("event_id", eventId)
                .eq("participant_id", profile.profileId)
                .single();

            if (paymentError || !paymentRecord || paymentRecord.status === "released") {
                return;
            }

            const res = await fetch('/api/stripe/release-payment', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    liveId,
                    userId: profile.profileId,
                    eventId,
                }),
            });

            const result = await res.json();
            if (res.ok) {
                console.log("✅ Payment released:", result);
            } else {
                console.error("❌ Release failed:", result.error);
            }
        } catch (err) {
            console.error("❌ Error releasing payment:", err);
        }
    };

    const getMusic = async (thinkTankId: string) => {
        try {
            const { data: music, error } = await supabase
                .from("background_music")
                .select("*")
                .eq("think_tank_id", thinkTankId)
                .maybeSingle();

            if (error) {
                console.error("Error Fetching Music: ", error);
                return;
            }

            if (music) {
                setBgMusic(music);
                setIsMusicPlaying(music.is_playing);
            } else {
                console.log("No background music found for this think tank.");
                setBgMusic(null);
                setIsMusicPlaying(false);
            }

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    useEffect(() => {
        getMusic(roomId);
        getEvents(roomId, true);

        const interval = setInterval(() => {
            getEvents(roomId, false);
        }, 30_000);

        return () => clearInterval(interval);
    }, [roomId]);

    // Ad rotation effect - rotate every 30 seconds (2 ads per minute)
    useEffect(() => {
        if (!showAds || ads.length === 0) return;

        // Record impression for current ad
        if (ads[currentAdIndex]) {
            recordImpression(ads[currentAdIndex].id, upcomingEvent?.id);
        }

        // Set up rotation interval
        const rotationInterval = setInterval(() => {
            setCurrentAdIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % ads.length;
                return nextIndex;
            });
        }, 30000); // 30 seconds

        return () => clearInterval(rotationInterval);
    }, [showAds, ads, currentAdIndex, upcomingEvent]);

    useEventRealTime(roomId, async (payload) => {
        if (payload?.new) {
            setEvents((prev: any) =>
                prev.map((event: any) =>
                    event.id === payload.new.id ? payload.new : event
                )
            );

            if (
                payload.old.status !== 'end' &&
                payload.new.status === 'end'
            ) {
                await releasePaymentForEvent(payload.new.id, payload.new.host);
            }
            await getEvents(roomId);
        }
    });

    const next = async () => setCurrentStep(currentStep + 1);

    const prev = () => setCurrentStep(currentStep - 1);

    useEffect(() => {
        const channel = supabase
            .channel(`room-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'background_music',
                    filter: `think_tank_id=eq.${roomId}`
                },
                (payload) => {
                    setBgMusic(payload.new);
                    setTimeout(() => {
                        if (audioRef.current) {
                            audioRef.current.load();
                            audioRef.current.play().catch(err => {
                                console.error('Autoplay error on participant side:', err);
                            });
                        }
                    }, 200);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const handleToggleVolumn = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.error("Play error:", err);
            });
        } else {
            audio.pause();
            setIsPlaying(false);
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

    const getYouTubeThumbnail = (url: string) => {
        const match = url && url.match(/(?:youtu\.be\/|youtube\.com\/.*v=)([^&]+)/);
        return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    }

    if (loading) {
        return (
            <div className='right-content'>
                <Skeleton active />
            </div>
        )
    }

    return (
        <>
            <div className='right-content'>
                <div>
                    {/* Paid Advertisement Section - Show only when event is within 30 minutes */}
                    {showAds && ads.length > 0 && (
                        <div style={{
                            marginBottom: 20,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333'
                        }}>
                            {loadingAds ? (
                                <Skeleton.Image active style={{ width: '100%', height: '200px' }} />
                            ) : (
                                <>
                                    <video
                                        ref={adVideoRef}
                                        autoPlay
                                        muted
                                        loop
                                        style={{
                                            width: '100%',
                                            height: '200px',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                        key={ads[currentAdIndex]?.id}
                                    >
                                        <source src={ads[currentAdIndex]?.video_url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div style={{
                                        padding: '12px 16px',
                                        backgroundColor: '#0a0a0a',
                                        borderTop: '1px solid #333'
                                    }}>
                                        <div style={{
                                            color: '#666',
                                            fontSize: 11,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: "5px 0",
                                            textAlign: "end"
                                        }}>
                                            Sponsored
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{
                                                    color: '#fff',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    marginBottom: 4
                                                }}>
                                                    {ads[currentAdIndex]?.title}
                                                </div>
                                                {ads[currentAdIndex]?.description && (
                                                    <div style={{
                                                        color: '#888',
                                                        fontSize: 12
                                                    }}>
                                                        {ads[currentAdIndex].description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {ads.length > 1 && (
                                            <div style={{
                                                display: 'flex',
                                                gap: 6,
                                                marginTop: 8,
                                                justifyContent: 'center'
                                            }}>
                                                {ads.map((_, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            backgroundColor: index === currentAdIndex ? '#fff' : '#444',
                                                            transition: 'background-color 0.3s'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className='detail-div'>
                        <div className='about-txt'>
                            <span className='about-heading'>ABOUT THIS THINK TANK</span>
                            {bgMusic && bgMusic?.is_playing && <span className='volumn-icon' onClick={handleToggleVolumn}>{isPlaying ? <IoMdVolumeHigh /> : <IoMdVolumeOff />}</span>}
                        </div>
                        <span className='room-heading'>{data?.title || ""}</span>
                        <p>{data?.description || ""}</p>
                        <span className='access-txt'>Access - {data?.accesstype || ""}</span>
                    </div>
                    <Announcements roomId={roomId} isHost={isHost} />
                    <div className='event-main'>
                        <span className='upcoming-event-heading'>Upcoming events</span>
                        <div>
                            <div className='event-div'>
                                {events && events.length > 0 ? (
                                    events.map((event: any) => {
                                        const eventTime = new Date(event.event_start_time).getTime();
                                        const isTimeReached = eventTime <= now;
                                        const eventStartDateTime = new Date(`${event.event_date}T${event.event_start_time}`);
                                        // const isTimeReached = new Date() >= eventStartDateTime;
                                        const isEventEnded = event.status === 'end'
                                        const participants = Array.isArray(event.participants) ? event.participants : [];
                                        const currentParticipant = participants?.find((p: any) => p.id === profile.profileId);
                                        const hasPaid = currentParticipant?.payment === "Paid" || event.type === "Free";
                                        const spotsFilled = event.slots === (event.participants.length - 1);
                                        const eventEnded = hasPaid && isEventEnded;
                                        const eventTimeZone = dayjs(event.event_start_time);
                                        const timeZoneAbbr = eventTimeZone.format('z');
                                        const isDonationBased = event.type === 'Donation based' && event.price == 0;

                                        let buttonText = "Join";
                                        let disabled = false;

                                        if (profile.profileId === event.host) {
                                            if (!isTimeReached) {
                                                buttonText = "Start";
                                                disabled = true;
                                            }
                                            buttonText = "Start";
                                            // disabled = false;
                                        } else {
                                            if (!currentParticipant && isDonationBased) buttonText = "Buy Now"
                                            else if (!currentParticipant && event.price > 0) buttonText = "Buy Now";
                                            else if (hasPaid && isTimeReached) buttonText = "Join";
                                            else if (hasPaid && !isTimeReached) {
                                                buttonText = "Join";
                                                disabled = true;
                                            }
                                        }

                                        if (!hasPaid && isTimeReached) {
                                            buttonText = "Time Out";
                                            disabled = true;
                                        } else if (!hasPaid && spotsFilled) {
                                            buttonText = "Slots Filled";
                                            disabled = true;
                                        } else if (eventEnded) {
                                            buttonText = "Event Ended";
                                            disabled = true;
                                        }

                                        return (
                                            // <div key={event.id} className='event-container'>
                                            //     <div className='event-detail'>
                                            //         <span className='event-name'>{event.event_name}</span>
                                            //         <span className='event-date'>{dayjs(event.event_date).format('MMMM D YYYY')}</span>
                                            //         <div>
                                            //             <span className='event-date'>{dayjs(event.event_start_time).format('h:mm:ss A')} {timeZoneAbbr}</span>
                                            //             <span className='event-date'>{dayjs(event.event_end_time).format('h:mm:ss A')} {timeZoneAbbr}</span>
                                            //         </div>
                                            //         <span className='event-price-type'>{event.type}</span>
                                            //     </div>
                                            //     <Button disabled={hasPaid && (!isTimeReached || shouldDisable)} loading={joinLoading === event.id} onClick={() => handleJoinEvent(event.id)}>{shouldDisable ? timeOutBtnTxt : buttonText}</Button>
                                            // </div>
                                            <EventCard
                                                key={event.id}
                                                eventId={event.id}
                                                title={event.event_name}
                                                description={event.description}
                                                date={event.event_date}
                                                timeRange={`${dayjs(event.event_start_time).format('h:mm A')} - ${dayjs(event.event_end_time).format('h:mm A')} ${timeZoneAbbr}`}
                                                country={event.country}
                                                priceType={event.type}
                                                price={event.price}
                                                mediaUrl={event?.media_file || getYouTubeThumbnail(event?.youtube_url)}
                                                isVideo={event.media_type === 'video'}
                                                isTimeReached={disabled}
                                                buttonLoading={joinLoading === event.id}
                                                onPress={() => handleJoinEvent(event.id)}
                                                buttonText={buttonText}
                                                participants={event.participants.length - 1}
                                            />
                                        );
                                    })
                                ) : (
                                    <Empty description='No Upcoming Events' image={emptyImg.src} styles={{ image: { width: 40, height: 40, display: "block", margin: "auto" }, description: { color: "#fff" } }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='cta-div'>
                    {/* {isHost && <Button color='green' variant='solid' icon={<IoMdAdd />} onClick={showModal} >Create New Event</Button>} */}
                    {/* {upcomingEvent && currentParticipant && <Button className='invite-btn' color='purple' variant='solid' disabled={upcomingEvent.slots === (upcomingEvent.participants.length - 1)} icon={<FcInvite />} onClick={() => setShowInviteModal(true)}>Spread the Vibe</Button>} */}
                    {/* {bgMusic && isMusicPlaying && (
                        <audio ref={audioRef} loop preload="auto" autoPlay>
                            <source src={bgMusic.music_url} type="audio/mpeg" />
                        </audio>
                    )} */}
                    {/* {isHost && <AddMusic roomId={roomId} bgMusic={bgMusic} setIsMusicPlaying={setIsMusicPlaying} isMusicPlaying={isMusicPlaying} />} */}
                    {/* <Button color='blue' variant='filled' icon={<RiFolderMusicFill />}>Add Music</Button>
                    <Button color='green' variant='filled' icon={<IoMdAdd />}>Create New Event</Button> */}
                    <AddMusic showModal={showMusicModal} setShowModal={setShowMusicModal} roomId={roomId} bgMusic={bgMusic} setIsMusicPlaying={setIsMusicPlaying} isMusicPlaying={isMusicPlaying} />
                    {upcomingEvent && currentParticipant && <Button style={{ flex: 1 }} color='purple' variant='filled' icon={<FcInvite />} disabled={upcomingEvent.slots === (upcomingEvent.participants.length - 1)} onClick={() => setShowInviteModal(true)}>Spread the Vibe</Button>}

                    {isHost && (<Dropdown menu={{
                        items: [{
                            key: "event",
                            label: 'Create New Event',
                            onClick: showModal,
                            icon: (
                                <span className='cta-icon'><IoMdAdd /></span>
                            )
                        },
                        {
                            key: "music",
                            label: 'Add Music',
                            onClick: () => setShowMusicModal(true),
                            icon: (
                                <span className='cta-icon'><RiFolderMusicFill /></span>
                            )
                        },
                        ]
                    }}
                        trigger={['click']}
                    >
                        {upcomingEvent && currentParticipant ? (
                            <Button color='blue' variant='filled' icon={<MdReadMore />} />
                        ) : (
                            <Button style={{ width: "100%" }} color='blue' variant='filled' icon={<MdReadMore />}>More Options</Button>
                        )}
                    </Dropdown>)}
                </div>
            </div >
            <ThemedModal
                roomType={roomType}
                themedTitle={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                            <HiOutlineCalendarDays size={20} />
                        </span>
                        <span>Add Event</span>
                    </div>
                }
                open={visible}
                onCancel={handleCancel}
                footer={null}
                width={600}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_event_form"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="event_name"
                        label="Title"
                        rules={[{ required: true, message: "Please enter the title!" }]}
                    >
                        <Input placeholder="Enter Event Title" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: "Please enter the description!" }]}
                    >
                        <Input.TextArea rows={4} placeholder="Enter description" />
                    </Form.Item>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Form.Item
                            style={{ width: "100%" }}
                            name="slots"
                            label="Number of Slots"
                            rules={[{ required: true, message: "Please enter the number of slots!" }]}
                        >
                            <InputNumber
                                min={1}
                                placeholder="Enter Available Slots"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Form.Item style={{ width: "100%", maxWidth: "50%" }} name="type" rules={[{ required: true, message: "Please Select the Type!" }]} label="Type">
                            <Select allowClear placeholder="Select Price type" style={{ width: "100%" }}>
                                <Select.Option value="Free">Free- No Payment</Select.Option>
                                <Select.Option value="Donation based">Donation Based – Participants can choose how much to pay (open amount)</Select.Option>
                                <Select.Option value="Direct Payment">Direct Payment – Fixed price must be paid to attend</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>
                    {selectedType === "Donation based" && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {presetAmounts.map((presetAmount) => (
                                <Button
                                    key={presetAmount}
                                    type={amount === presetAmount ? 'primary' : 'default'}
                                    onClick={() => setAmount(presetAmount)}
                                    style={{ minWidth: '60px' }}
                                >
                                    ${presetAmount}
                                </Button>
                            ))}
                        </div>
                    )}
                    {selectedType && selectedType !== 'Free' && (
                        <InputNumber
                            value={amount}
                            onChange={(value) => setAmount(value || 1)}
                            addonBefore="$"
                            min={1}
                            placeholder="Enter Price"
                            style={{ width: "100%", marginBottom: 15 }}
                            precision={2}
                        />
                    )}
                    <div>
                        <span style={{ paddingBottom: 8, display: "block" }}>Event Date</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Form.Item
                                style={{ width: "100%" }}
                                name="event_date"
                                rules={[{ required: true, message: "Please select the date and time!" }]}
                            >
                                <DatePicker
                                    style={{ width: "100%" }}
                                    placeholder="Select Event Date"
                                />
                            </Form.Item>
                        </div>
                        <span style={{ paddingBottom: 8, display: "block" }}>Event Time</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Form.Item name="event_start_time" style={{ width: "100%" }} rules={[{ required: true, message: "Please select event start time!" }]}>
                                <TimePicker placeholder="Select Event Start Time" style={{ width: "100%" }} format="h:mm:ss A" use12Hours />
                            </Form.Item>
                            <Form.Item
                                name="event_end_time"
                                style={{ width: "100%" }}
                                dependencies={['event_start_time']}
                                rules={[
                                    { required: true, message: "Please select event end time!" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const start = getFieldValue('event_start_time');
                                            if (!value || !start) {
                                                return Promise.resolve();
                                            }
                                            if (value.isAfter(start)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error("End time must be after the start time!")
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <TimePicker placeholder="Select Event End Time" style={{ width: "100%" }} format="h:mm:ss A" use12Hours />
                            </Form.Item>
                        </div>
                    </div>
                    <Form.Item
                        name="media_type"
                        label="Media Type"
                        rules={[{ required: true, message: "Please select media type!" }]}
                    >
                        <Select placeholder="Select Media Type" allowClear>
                            <Select.Option value="image">Image (JPG/PNG, max 5MB)</Select.Option>
                            <Select.Option value="video">Video (MP4, max 200MB)</Select.Option>
                            <Select.Option value="youtube">YouTube Link</Select.Option>
                        </Select>
                    </Form.Item>

                    {/* Conditional fields */}
                    {(mediaType === "image" || mediaType === 'video') && (
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                {mediaType === "image" ? "Upload Image" : "Upload Video"}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept={mediaType === "image" ? "image/jpeg,image/png" : "video/mp4"}
                                style={{ display: 'none' }}
                            />
                            {attachedFile && (
                                <div style={{ fontSize: 16 }}>
                                    <span style={{ fontWeight: "600" }}>Selected: </span>
                                    <span style={{ color: "gray" }}>{attachedFile.name}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {mediaType === "youtube" && (
                        <Form.Item
                            name="youtube_url"
                            label="YouTube Link"
                            rules={[
                                { required: true, message: "Please enter YouTube link!" },
                                { type: "url", message: "Please enter a valid URL!" }
                            ]}
                        >
                            <Input placeholder="Enter YouTube link" />
                        </Form.Item>
                    )}
                    <div style={{ display: "flex", justifyContent: "end", gap: 15, margin: "10px 0" }}>
                        <Button style={{ padding: "17px 30px", fontSize: 15 }} onClick={handleCancel}>Cancel</Button>
                        <Button style={{ padding: "17px 35px", fontSize: 15 }} type="primary" onClick={handleAddEvent} loading={addEventLoading}>Add Event</Button>
                    </div>
                </Form>
            </ThemedModal>

            <ThemedModal
                roomType={roomType}
                themedTitle={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                            <HiOutlineCreditCard size={20} />
                        </span>
                        <span>Event Payment</span>
                    </div>
                }
                open={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                centered
                width={600}
                footer={null}
            >
                {(selectedEventType === 'Donation based' && eventPrice == 0) ? (
                    <>
                        {currentStep === 0 && (
                            <Form layout="vertical">
                                <Form.Item
                                    label="Enter Donation Amount"
                                    required
                                    rules={[
                                        { required: true, message: "Please enter your amount" },
                                        { type: "number", min: 1, message: "Donation must be at least $1" },
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        placeholder="Enter amount"
                                        style={{ width: "100%" }}
                                        value={userDonationAmount}
                                        onChange={(value: any) => setUserDonationAmount(value)}
                                    />
                                </Form.Item>
                            </Form>
                        )}

                        {currentStep === 1 && (
                            <StripePayment
                                profile={profile}
                                eventId={eventId}
                                eventHost={data?.host}
                                paymentAmount={userDonationAmount!}
                                setShowHireModal={setShowPaymentModal}
                            />
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 15 }}>
                            {currentStep > 0 && (
                                <Button style={{ margin: "0 10px 0 0" }} onClick={prev}>Back</Button>
                            )}
                            {currentStep < 1 && (
                                <Button type="primary" onClick={next} disabled={!userDonationAmount}>Next</Button>
                            )}
                        </div>
                    </>
                ) : (
                    <StripePayment
                        profile={profile}
                        eventId={eventId}
                        eventHost={data?.host}
                        paymentAmount={eventPrice!}
                        setShowHireModal={setShowPaymentModal}
                    />
                )}
            </ThemedModal>

            <ThemedModal
                roomType={roomType}
                themedTitle={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                            <HiOutlineShare size={20} />
                        </span>
                        <span>Invite Others</span>
                    </div>
                }
                open={showInviteModal}
                onCancel={() => setShowInviteModal(false)}
                footer={null}
                width={600}
            >
                <div>
                    <Button type="primary" onClick={() => handleInvite(upcomingEvent.id)}>Copy Link</Button>
                    <div style={{ margin: "20px 0" }}>
                        <span className='share-heading'>Share</span>
                        <div className='sc-div'>
                            <span className='sc-icon fb-icon' onClick={() => eventInvite('https://www.facebook.com')}><FaFacebook /></span>
                            <span className='sc-icon' onClick={() => eventInvite('https://x.com')}><FaXTwitter /></span>
                            <span className='sc-icon' onClick={() => eventInvite('https://www.threads.com')}><FaSquareThreads /></span>
                            <span className='sc-icon mail-icon' onClick={() => eventInvite('https://mail.google.com')}><IoMail /></span>
                        </div>
                    </div>
                </div>
            </ThemedModal>

        </>
    )
}

export default RightComponent