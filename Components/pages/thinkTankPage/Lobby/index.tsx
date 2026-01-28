'use client'
import React, { useEffect, useRef, useState } from 'react'
import './style.css'
import Image from 'next/image'
import startingSoonImg from '@/public/assets/img/event-starting.png'
import startingInImg from '@/public/assets/img/event-starting-in.png'
import { supabase } from '@/config/supabase'
import { Button, DatePicker, Empty, Form, Input, Modal, Radio, Skeleton, Tag, Typography, message } from 'antd'
import { fetchThinkTankEvents } from '@/utils/fetchEvents'
import userImg from '@/public/assets/img/userImg.webp'
import { MdOutlineEmojiEmotions } from 'react-icons/md'
import { IoSend } from 'react-icons/io5'
import { useAppSelector } from '@/store'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { RiChatOffFill } from "react-icons/ri";
import { FaUser } from "react-icons/fa";
import { useEventRealTime } from '@/hooks/useEventRealTime'
import { IoVideocamOutline } from 'react-icons/io5'
import ArtExhibitRoom from '../../thinkTankMessageRoom/ArtExhibit'
import CollabFitnessRoom from '../../thinkTankMessageRoom/CollabFitnessRoom'
import { FcGallery } from "react-icons/fc";
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs';
import { getRoomTitle } from '@/lib/collabRoomTitle'
import { getTheme } from '@/lib/roomThemes'
import styles from './modal.module.css'
import CollabRoomGridRow from '@/Components/UIComponents/CollabRoomGridRow'
import ThemedModal from '@/Components/UIComponents/ThemedModal'
import ThemedOverlay from '@/Components/UIComponents/ThemedOverlay'

const { Title } = Typography;

interface User {
    userId: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
}


const Lobby = ({ thinkTankId, isRoomHost, thinkTank, addLiveStream, hostId, isLiveGoing }: any) => {
    const [upcomingEvent, setUpcomingEvent] = useState<any>(null)
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const profile = useAppSelector((state) => state.auth);
    const [messages, setMessages] = useState<any>(null)
    const [newMessage, setNewMessage] = useState("");
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const prevMessageCountRef = useRef(0);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [muteChat, setMuteChat] = useState(false);
    const [showArtExhibitRoom, setShowArtExhibitRoom] = useState(false);
    const [showFitnessRoom, setShowFitnessRoom] = useState(false);
    const [chooseSessionModal, setChooseSessionModal] = useState(false);
    const [showExpiryModal, setShowExpiryModal] = useState(false);
    const [form] = Form.useForm();
    const [expiryDate, setExpiryDate] = useState<string | null>(thinkTank?.end_datetime ? dayjs(thinkTank.end_datetime).format("MMMM D, YYYY") : null);
    const isHost = profile.profileId === hostId;
    const [startingCollaboration, setStartingCollaboration] = useState(false);

    const startCollaboration = async (eventId: string) => {
        try {
            setStartingCollaboration(true);

            const { error } = await supabase
                .from("think_tank_events")
                .update({ status: 'started' })
                .eq("id", eventId);

            if (error) {
                console.error("Error starting collaboration:", error);
                return;
            }

        } catch (err) {
            console.error("Unexpected error starting collaboration:", err);
        } finally {
            setStartingCollaboration(false);
        }
    };

    const handleGo = async () => {
        try {
            const values = await form.getFieldsValue();
            const streamType = values.session_mode;
            addLiveStream(
                thinkTank?.id,
                thinkTank?.host,
                {
                    id: profile.profileId,
                    name: profile.firstName,
                    picture: profile.profileImage,
                    role: "host",
                    stream_role: "host"
                },
                streamType
            )
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    const getEvents = async (thinkTankId: string, isInitial = false) => {
        try {
            if (isInitial) {
                setInitialLoading(true);
            }

            const data = await fetchThinkTankEvents(thinkTankId);
            const now = Date.now();

            const filtered = data
                .filter(event => event.status !== 'end')
                .map(event => {
                    const eventTime = new Date(event.event_start_time).getTime();
                    const diff = eventTime - now;
                    const eventStartDateTime = new Date(`${event.event_date}T${event.event_start_time}`).getTime();
                    const isTimeReached = now >= eventStartDateTime;  // If event start time has passed
                    // const diff = eventStartDateTime - now;
                    return {
                        ...event,
                        remaining: diff
                    };
                })
                .filter(event => event.remaining >= 0 && event.remaining <= 30 * 60 * 1000)
                .sort((a, b) => a.remaining - b.remaining);

            if (filtered.length > 0) {
                setUpcomingEvent(filtered[0]);
                setRemainingTime(filtered[0].remaining);
                setMuteChat(filtered[0].is_chat_muted ?? false);
            } else {
                setUpcomingEvent(null);
                setRemainingTime(null);
                setMuteChat(false);
            }
        } catch (err) {
            console.error("Lobby fetching Error: ", err);
        } finally {
            if (isInitial) {
                setInitialLoading(false);
            }
        }
    };

    useEffect(() => {
        getEvents(thinkTankId, true);

        const interval = setInterval(() => {
            getEvents(thinkTankId, false);
        }, 30_000);

        return () => clearInterval(interval);
    }, [thinkTankId, thinkTank?.room_type]);

    useEffect(() => {
        if (!upcomingEvent) return;

        const interval = setInterval(() => {
            const timeLeft = new Date(upcomingEvent.event_start_time).getTime() - Date.now()
            setRemainingTime(Math.max(timeLeft, 0))
        }, 1000)

        return () => clearInterval(interval)
    }, [upcomingEvent])

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const totalMinutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60

        return {
            minutes: totalMinutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0')
        }
    }

    const getMessages = async (thinkTankId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('think_tank_id', thinkTankId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error)
                return
            }

            const userIds = data.map((msg) => msg.sender_id).filter(Boolean)

            const { data: users, error: fetchError } = await supabase
                .from('users')
                .select('userId, firstName, lastName, profileImage')
                .in('userId', userIds)

            if (fetchError) {
                console.error('Error fetching users:', error)
                return
            }

            const userMap = users.reduce((acc: any, user: any) => {
                acc[user.userId] = user;
                return acc;
            }, {});

            setUsers(userMap);
            setMessages(data);

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const messagePayload = {
            message: newMessage.trim() || null,
            sender_id: profile.profileId,
            message_type: "text",
            think_tank_id: thinkTankId,
            ...(replyTo && { reply_to: replyTo.id }),
        };

        const { error } = await supabase.from('messages').insert([messagePayload]);

        if (error) {
            console.error('Message sending failed', error);
            return;
        }

        setNewMessage("");
        setReplyTo(null);
    };

    useEffect(() => {
        if (!thinkTankId) return;

        getMessages(thinkTankId);

        const subscription = supabase
            .channel(`chat-${thinkTankId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                async (payload) => {
                    if (payload.new.think_tank_id === thinkTankId) {
                        setMessages((prev: any) => [...prev, payload.new]);

                        const senderId = payload.new.sender_id;
                        if (senderId && !users[senderId]) {
                            try {
                                const { data: userData, error } = await supabase
                                    .from('users')
                                    .select('userId, firstName, lastName, profileImage')
                                    .eq('userId', senderId)
                                    .single();

                                if (!error && userData) {
                                    setUsers((prevUsers) => ({
                                        ...prevUsers,
                                        [userData.userId]: userData
                                    }));
                                }
                            } catch (err) {
                                console.error('Error fetching user for new message:', err);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [thinkTankId, users]);

    const scrollToBottom = () => {
        if (messagesEndRef?.current) {
            const scroll = messagesEndRef.current.scrollHeight - messagesEndRef.current.clientHeight;
            messagesEndRef.current.scrollTo({
                top: scroll,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        if (messages && messages.length > prevMessageCountRef.current) {
            scrollToBottom();
            prevMessageCountRef.current = messages.length;
        }
    }, [messages]);

    const addEmoji = (emoji: any) => {
        setNewMessage((prev: any) => prev + emoji.native);
        setShowEmojiPicker(false);
    };

    const handleMuteChats = async (eventId: string) => {
        try {
            const { error } = await supabase
                .from("think_tank_events")
                .update({ is_chat_muted: !muteChat })
                .eq("id", eventId);

            if (error) {
                console.error("Error Muting Chats: ", error);
                return;
            }

            setMuteChat((prevMuteState) => !prevMuteState);

        } catch (err) {
            console.error("Unexpected Error in muting chats: ", err);
        }
    };

    const updateExp = async (id: string) => {
        try {
            const values = await form.validateFields();

            const newDate = values.endDateTime?.toISOString(); // assuming `endDateTime` is a dayjs object

            const { error } = await supabase
                .from("thinktank")
                .update({ end_datetime: newDate })
                .eq("id", id);

            if (error) {
                console.error("Error updating date", error);
                return;
            }
            const formattedDate = dayjs(newDate).format("MMMM D, YYYY");
            setExpiryDate(formattedDate);
            setShowExpiryModal(false);
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };


    useEventRealTime(thinkTankId, (payload) => {
        if (payload?.new.is_chat_muted !== undefined) {
            setMuteChat(payload.new.is_chat_muted);
        }
    });

    if (initialLoading) {
        return (
            <div className="lobby-main">
                <Skeleton active />
            </div>
        )
    }

    const roomType = thinkTank?.room_type;
    const theme = getTheme(roomType);

    if (!upcomingEvent) {
        return (
            <CollabRoomGridRow>
                <div className='room-tagline' style={{ '--room-theme-primary': theme.primary, '--room-theme-gradient': theme.gradient } as React.CSSProperties}>
                    {!isHost && !isLiveGoing ? (
                        <span className='lobby-heading big-heading-lobby themed-heading' style={{ background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{getRoomTitle(thinkTank.room_type)}</span>
                    ) : (
                        <span className='lobby-heading themed-heading' style={{ background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{getRoomTitle(thinkTank.room_type)}</span>
                    )}
                    {thinkTank.room_type === "collab_fitness" && (<span className='lobby-tagline'>Where creativity meets movement.</span>)}
                </div>
                <div className="lobby-main">
                    <div className='lobby-content'>
                        <div>
                            <div className='advertisement-video-div'>
                                <video autoPlay muted loop className="advertisement-video">
                                    <source src={"/assets/videos/advertisement.mp4"} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            {thinkTank.room_type !== "think_tank" && (<div className='advertisement-div'>
                                {(thinkTank.room_type === "soundscape" || thinkTank.room_type === "wordflow" || thinkTank.room_type === "open_collab") && isRoomHost && (<Button icon={<IoVideocamOutline className='icon' />} onClick={() => addLiveStream(thinkTank?.id, thinkTank?.host, { id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "host", stream_role: "host" }, 'live_Video_with_Chat')}>Go Live</Button>)}
                                {thinkTank.room_type === "art_exhibit" && isRoomHost && (<Button icon={<IoVideocamOutline className='icon' />} onClick={() => setChooseSessionModal(true)}>Go Live</Button>)}
                                {thinkTank.room_type === "collab_fitness" && isRoomHost && (<Button icon={<IoVideocamOutline className='icon' />} onClick={() => addLiveStream(thinkTank?.id, thinkTank?.host, { id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "host", stream_role: "host" }, 'live_Video_with_Chat')}>🎯 Enter Workout Mode</Button>)}
                                {thinkTank.room_type === 'art_exhibit' && (<Button icon={<FcGallery className='icon' />} onClick={() => setShowArtExhibitRoom(true)}>View Artwork</Button>)}
                                {thinkTank.room_type === 'collab_fitness' && (<Button icon={<IoVideocamOutline className='icon' />} onClick={() => setShowFitnessRoom(true)}>View Workouts</Button>)}
                            </div>)}
                        </div>
                        {thinkTank.recurring === 'Recurring Think Tank' && isHost && (
                            <div className="lower-div">
                                <div className="expiry-section">
                                    <div className='expiry-section-content'>
                                        <div className="expiry-info">
                                            <ClockCircleOutlined />
                                            <span className="room-exp-h1">Room expires:</span>
                                        </div>
                                        <div className="expiry-date">{expiryDate || "Unknown"}</div>
                                    </div>
                                    <Button variant='solid' color='purple' className="extend-btn" onClick={() => setShowExpiryModal(true)} icon={<CalendarOutlined />}>Extend Room Expiry</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <ThemedModal
                    roomType={roomType}
                    title="Select Session Mode"
                    open={chooseSessionModal}
                    onCancel={() => setChooseSessionModal(false)}
                    footer={null}
                    width={700}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="session_mode"
                            label="Room Type"
                            rules={[{ required: true, message: "Please Select the Session Mode!" }]}
                        >
                            <Radio.Group
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 20 }}
                            >
                                <Radio value="live_Video_with_Chat">
                                    <strong>Live Video with Chat</strong> – Host appears on camera to present artwork and respond to messages in real-time.
                                </Radio>
                                <Radio value="audio_Chat">
                                    <strong>Audio + Chat</strong> – Host speaks (no video) while viewers engage via live chat.
                                </Radio>
                                <Radio value="chat_Only">
                                    <strong>Chat-Only</strong> – No video or audio. Host types responses while showcasing artwork.
                                </Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Button type="primary" icon={<IoVideocamOutline className='icon' />} onClick={handleGo}>
                            Go
                        </Button>
                    </Form>
                </ThemedModal>
                <ThemedModal
                    roomType={roomType}
                    title="Extend Room Expiry"
                    open={showExpiryModal}
                    onCancel={() => setShowExpiryModal(false)}
                    footer={null}
                    width={700}
                >
                    <Form form={form} layout="vertical">
                        <div className="current-expiry">
                            <span className="expiry-label">Current Expiry Date:</span>
                            <span className="modal-expiry-date">{expiryDate || "Unknown"}</span>
                        </div>
                        <Form.Item style={{ width: "100%" }} name="endDateTime">
                            <DatePicker style={{ width: "100%" }} placeholder='Select End Date' />
                        </Form.Item>
                    </Form>
                    <div className="help-text">
                        <p>💡 The new expiry date must be in the future and after the current expiry date. All participants will be notified of the extension.</p>
                    </div>
                    <div className="exp-modal-footer">
                        <Button onClick={() => setShowExpiryModal(false)}>Cancel</Button>
                        <Button type="primary" onClick={() => updateExp(thinkTankId)}>
                            Extend Expiry
                        </Button>
                    </div>
                </ThemedModal>
                <ArtExhibitRoom open={showArtExhibitRoom} onCancel={() => setShowArtExhibitRoom(false)} hostId={hostId} />
                <ThemedModal
                    roomType={roomType}
                    title="Workout Resources"
                    open={showFitnessRoom}
                    onCancel={() => setShowFitnessRoom(false)}
                    footer={null}
                    destroyOnClose
                    className={styles.fitnessModal}
                >
                    <CollabFitnessRoom
                        roomId={thinkTank?.id}
                        isHost={isHost}
                        hostId={thinkTank?.host}
                        userId={profile.profileId!}
                    />
                </ThemedModal>
            </CollabRoomGridRow>
        )
    }

    return (
        <>
            <div className='lobby-main upcoming-event-container'>
                <ThemedOverlay roomType={roomType} variant="countdown" className='strt-event-container'>
                    <div className='strt-event-detail'>
                        <div className={styles.streamDetail}>
                            <div className={styles.streamStatus}>
                                <span className={styles.statusDot}></span>
                                <span className={styles.streamBoxTitle}>Live Streaming</span>
                            </div>
                            <span className='strt-event-name'>{upcomingEvent.event_name}</span>
                            <span className='strt-event-date'>{new Date(upcomingEvent.event_date).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.eventTime}>
                            <div className='start-in-div'>
                                <span className='strt-label'>Start In</span>
                            </div>
                            <div className='start-time-div'>
                                <span className='strt-event-time' style={{ background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatTime(remainingTime!).minutes}</span>
                                <span className='strt-label'>Minutes</span>
                                <span className='strt-event-time' style={{ background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatTime(remainingTime!).seconds}</span>
                                <span className='strt-label'>Seconds</span>
                            </div>
                        </div>
                        {isRoomHost && (
                            <Button
                                className='join-button'
                                onClick={() => startCollaboration(upcomingEvent.id)}
                                loading={startingCollaboration}
                                type="primary"
                                style={{ background: theme.gradient, border: 'none' }}
                            >
                                Start Collaboration
                            </Button>
                        )}

                        {!isRoomHost && (
                            <div className='waiting-for-host' style={{ background: theme.gradient }}>
                                <span>Waiting for host to start collaboration...</span>
                            </div>
                        )}
                    </div>
                    {remainingTime && remainingTime <= 10 * 60 * 1000 ? (
                        <Image src={startingInImg} alt='strt-event-img' width={200} height={200} />
                    ) : (
                        <Image src={startingSoonImg} alt='strt-event-img' width={200} height={200} />
                    )}
                </ThemedOverlay>
                <div>
                    <div className='host-intr'>
                        {upcomingEvent.slots === (upcomingEvent.participants.length - 1)
                            ? <span className='spot-filled'>All Spots Filled – Let's Go! 🤝</span>
                            : (
                                <span>
                                    <strong>Spots Available: </strong>
                                    {(upcomingEvent.slots - (upcomingEvent.participants.length - 1)).toString().padStart(2, '0')}
                                </span>
                            )}
                        {isRoomHost && (
                            <div className='host-intr-div'>
                                {!muteChat && <Button icon={<FaUser />} onClick={() => setShowGuestModal(true)}>View Guests</Button>}
                                <Button icon={<RiChatOffFill style={muteChat ? { color: "orange" } : {}} />} onClick={() => handleMuteChats(upcomingEvent.id)}>{muteChat ? "Unmute Chats" : "Mute Chats"}</Button>
                            </div>
                        )}
                    </div>
                    {muteChat ? (
                        <div className='mt-event-container'>
                            <span className='event-guest-heading'>Event Guests</span>
                            <div className='event-guest-div-mt'>
                                {upcomingEvent && upcomingEvent.participants.map((guest: any) => {
                                    const isHost = guest.role === "host";
                                    const currentUser = guest.id === profile.profileId;
                                    const forEvent = guest.fromInvite;
                                    const userData = users

                                    return (
                                        <div key={guest.id} className='event-guest' >
                                            <Image className='lb-user-img' src={guest.picture || userImg} alt='user-img' width={100} height={100} />
                                            <span className='event-user-name'>{currentUser ? "You" : guest.name}</span>
                                            {isHost && <span style={{ fontSize: 13 }}><Tag color='cyan'>Host</Tag></span>}
                                            {forEvent && <span style={{ fontSize: 13 }}><Tag color='geekblue'>For Event</Tag></span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className='lb-message-main'>
                            <div id='message-container' ref={messagesEndRef} className='lb-message-container'>
                                {(messages && messages.length > 0) ? (messages.map((message: any) => {
                                    const user = users[message.sender_id] || {};

                                    return (
                                        <div id={`message_${message.id}`} key={message.id} className='lb-message'>
                                            <Image className='lb-user-img' src={user.profileImage || userImg} alt='user-img' width={100} height={100} />
                                            <div className='lb-message-details'>
                                                <span className='lb-user-name'>{user.firstName + " " + user.lastName}</span>
                                                <p className='lb-user-message'>{message.message}</p>
                                            </div>
                                        </div>
                                    )
                                })) : (
                                    <div>
                                        <Empty description={null} />
                                        <span style={{ textAlign: "center", display: "block", color: "white", fontWeight: 600, fontSize: 30 }}>Now message yet.....</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '60px', zIndex: 10 }}>
                                        <Picker data={data} onEmojiSelect={addEmoji} />
                                    </div>
                                )}
                                <Input className='message-input' placeholder='Message' prefix={<MdOutlineEmojiEmotions
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmojiPicker(!showEmojiPicker);
                                    }}
                                    className='emoji-icon' />} suffix={<span onClick={sendMessage}><IoSend /></span>} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onPressEnter={sendMessage} />
                            </div>
                        </div >
                    )}
                </div>
            </div>

            <ThemedModal
                roomType={roomType}
                title="Event Guests"
                open={showGuestModal}
                onCancel={() => setShowGuestModal(false)}
                footer={null}
                width={600}
            >
                <div className='event-guest-div'>
                    {upcomingEvent && upcomingEvent.participants.map((guest: any) => {
                        const isHostGuest = guest.role === "host";
                        const currentUser = guest.id === profile.profileId

                        return (
                            <div key={guest.id} className='event-guest' >
                                <Image className='lb-user-img' src={guest.picture || userImg} alt='user-img' width={100} height={100} />
                                <span className='event-user-name'>{currentUser ? "You" : guest.name}</span>
                                {isHostGuest && <span style={{ fontSize: 13 }}><Tag color={theme.tagColor}>Host</Tag></span>}
                            </div>
                        )
                    })}
                </div>
            </ThemedModal>
        </>
    )
}

export default Lobby