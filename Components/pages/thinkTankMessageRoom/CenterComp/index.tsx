import React, { useEffect, useRef, useState } from 'react'
import userImage from "@/public/assets/img/userImg.webp"
import Image from 'next/image'
import { RiNotificationOffLine } from "react-icons/ri";
import { IoNotificationsOutline, IoVideocamOutline } from "react-icons/io5";
import { Button, Input, Modal, Popover, Select, Typography, Form, InputNumber } from 'antd'
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { useAppDispatch, useAppSelector } from '@/store';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import { useRouter, useSearchParams } from 'next/navigation';
import { BsArrow90DegRight } from "react-icons/bs";
import { BsReply } from "react-icons/bs";
import "./style.css"
import data from '@emoji-mart/data'
import MessageRenderer from './MessageRenderer';
import InputMessage from './InputMessage';
import { RiArrowUpDoubleFill } from "react-icons/ri";
import StripePayment from '@/Components/StripePayment';
import { MdOutlineElectricBolt } from "react-icons/md";
import Lobby from '../../thinkTankPage/Lobby';
import SoundScapeStream from '../SoundScapeStream';
import ProviderStream from '../../LiveStream/providerStream';
import Link from 'next/link';
import { setLiveStreamEnded, setLiveStreamStarted } from '@/store/slices/liveStream';
import CollabRoomGridRow from '@/Components/UIComponents/CollabRoomGridRow';
import ThemedModal from '@/Components/UIComponents/ThemedModal';
import { getTheme } from '@/lib/roomThemes';

dayjs.extend(relativeTime)
dayjs.extend(calendar)
const { Title } = Typography;

interface User {
    userId: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
}

interface componentProps {
    conversationId?: string;
    thinkTank: any;
    thinkTankId: string;
    centerView: 'lobby' | 'live' | 'chat';
    setCenterView: (view: 'lobby' | 'live' | 'chat') => void;
}

const CenterComponent: React.FC<componentProps> = ({ conversationId, thinkTank, thinkTankId, centerView, setCenterView }) => {
    const [messages, setMessages] = useState<any>(null)
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<Record<string, User>>({})
    const profile = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const [loadingMessages, setLoadingMessages] = useState(true)
    const profileId = profile.profileId;
    const searchParams = useSearchParams();
    const keyword = searchParams.get("channel")
    const channelName = keyword?.replace("-", ' ').toLowerCase();
    const channelId = searchParams.get("rn");
    const receiverId = searchParams.get("ch")
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const prevMessageCountRef = useRef(0);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const isHost = profile.profileId === thinkTank?.host;
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [boostModal, setBoostModal] = useState(false);
    const [form] = Form.useForm();
    const [selectedBoost, setSelectedBoost] = useState<any>('');
    const [customBoost, setCustomBoost] = useState<number | undefined>();
    const [startingLiveStream, setStartingLiveStream] = useState(false);
    const [liveStreamId, setLiveStreamId] = useState<string | null>(null);

    const roomType = thinkTank?.room_type;
    const theme = getTheme(roomType);

    const boostPrices: Record<number, number> = {
        1: 15,
        2: 30,
        3: 45,
    };

    const calculatePrice = () => {
        if (customBoost) {
            return (customBoost * 15) / 100;
        }
        if (selectedBoost) {
            return boostPrices[selectedBoost] || 0;
        }
        return 0;
    };

    const fetchReceiverUser = async (receiverId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('userId, firstName, lastName, profileImage')
                .eq('userId', receiverId)
                .single();

            if (error) {
                console.error('Error fetching receiver user:', error);
                return;
            }

            setOtherUser(data);
        } catch (err) {
            console.error('Unexpected error fetching receiver user:', err);
        }
    };

    const getMessages = async (conversationId: string) => {
        setLoadingMessages(true)
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error)
                return
            }

            const userIds = [...new Set(data.map((msg) => msg.sender_id).concat(data.map((msg) => msg.receiver_id)))].filter(Boolean)

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
        } finally {
            setLoadingMessages(false)
        }
    }

    const getChannelMessages = async (channelId: string) => {
        try {
            const { data, error } = await supabase
                .from('channel_messages')
                .select('*')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching channel messages:', error);
                return;
            }

            const userIds = [...new Set(data.map((msg) => msg.sender_id))];

            const { data: users, error: fetchError } = await supabase
                .from('users')
                .select('userId, firstName, lastName, profileImage')
                .in('userId', userIds);

            if (fetchError) {
                console.error('Error fetching users:', fetchError);
                return;
            }

            const userMap = users.reduce((acc: any, user: any) => {
                acc[user.userId] = user;
                return acc;
            }, {});

            setUsers(userMap);
            setMessages(data);

        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !attachedFile && !audioBlob) return;

        let fileUrl = null;
        let messageType = 'text';

        if (attachedFile) {
            const fileName = `${Date.now()}_${attachedFile.name}`;
            const filePath = `messages/${fileName}`;
            const { data, error: uploadError } = await supabase.storage
                .from("chat-uploads")
                .upload(filePath, attachedFile);

            if (uploadError) {
                console.error("File upload failed", uploadError);
                return;
            }

            fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-uploads/${filePath}`;

            if (attachedFile.type === "image/gif") {
                messageType = "gif";
            } else if (attachedFile.type.startsWith("video/")) {
                messageType = "video";
            } else {
                messageType = "file";
            }
        }

        if (audioBlob) {
            const fileName = `${Date.now()}.webm`;
            const filePath = `messages/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from("chat-uploads")
                .upload(filePath, audioBlob, {
                    contentType: "audio/webm",
                });

            if (uploadError) {
                console.error("Audio upload failed", uploadError);
                return;
            }

            fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-uploads/${filePath}`;

            messageType = "audio";
        }

        const messagePayload = {
            message: newMessage.trim() || null,
            sender_id: profile.profileId,
            message_type: messageType,
            ...(replyTo && { reply_to: replyTo.id }),
            ...(fileUrl && { file_url: fileUrl }),
        };

        const targetTable = keyword ? 'channel_messages' : 'messages';
        const insertData = keyword
            ? { ...messagePayload, channel_id: channelId }
            : { ...messagePayload, receiver_id: receiverId, conversation_id: conversationId };

        const { error } = await supabase.from(targetTable).insert([insertData]);

        if (error) {
            console.error('Message sending failed', error);
            return;
        }

        setNewMessage("");
        setReplyTo(null);
        setAttachedFile(null);
        setAudioBlob(null);

    };

    const toggleReaction = async (message: any, reactionType: string) => {
        const userId = profile.profileId;
        const currentReactions = message.reactions || [];

        const existingReaction = currentReactions.find((r: any) => r.user_id === userId);

        let updatedReactions;

        if (existingReaction) {
            if (existingReaction.reaction === reactionType) {
                updatedReactions = currentReactions.filter((r: any) => r.user_id !== userId);
            } else {
                updatedReactions = currentReactions.map((r: any) => r.user_id === userId ? { ...r, reaction: reactionType } : r);
            }
        } else {
            updatedReactions = [...currentReactions, { user_id: userId, reaction: reactionType }];
        }

        const table = keyword ? 'channel_messages' : 'messages';

        const { error } = await supabase
            .from(table)
            .update({ reactions: updatedReactions })
            .eq('id', message.id);

        if (error) {
            console.error("Error updating reactions:", error);
        }
    };

    const reactionContent = (message: any) => (
        <div style={{ display: "flex", gap: 5 }}>
            {["👍", "😂", "❤️", "😠"].map((reaction) => (
                <span key={reaction} onClick={() => toggleReaction(message, reaction)} style={{ cursor: "pointer" }}>
                    {reaction}
                </span>
            ))}
        </div>
    );

    const reactionDetail = (message: any) => {
        const allReactions = message.reactions || [];
        const emojiGroups: { [emoji: string]: string[] } = {};

        allReactions.forEach((reaction: any) => {
            const emoji = reaction.reaction;
            const user = users[reaction.user_id];
            const name = user ? reaction.user_id === profileId ? "You Reacted" : user.firstName : "User";

            if (!emojiGroups[emoji]) emojiGroups[emoji] = [];
            emojiGroups[emoji].push(name);
        });

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(emojiGroups).map(([emoji, names]) => (
                    <div key={emoji} style={{ display: "flex", gap: 8 }}>
                        <span>{names.join(", ")}</span>
                        <span>{emoji}</span>
                    </div>
                ))}
            </div>
        );
    };

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

    const goToFilterData = (id: string | number) => {
        const element = document.getElementById(`message_${id}`);
        const container = document.getElementById("message-container");

        if (element && container) {
            const elementOffsetTop = element.offsetTop;
            const containerOffsetTop = container.offsetTop;

            const scrollPosition = elementOffsetTop - containerOffsetTop;

            container.scrollTo({
                top: scrollPosition,
                behavior: "smooth",
            });
        }
    };

    useEffect(() => {
        if (!conversationId) return;
        getMessages(conversationId);
        const subscription = supabase
            .channel(`chat-${conversationId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload) => {
                    if (payload.new.conversation_id === conversationId) {
                        setMessages((prev: any) => [...prev, payload.new]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [conversationId, users, receiverId])

    useEffect(() => {
        if (channelId) {
            getChannelMessages(channelId)
            const subscription = supabase
                .channel(`channel-${channelId}`)
                .on(
                    "postgres_changes",
                    { event: "INSERT", schema: "public", table: "channel_messages" },
                    (payload) => {
                        if (payload.new.channel_id === channelId) {
                            setMessages((prev: any) => [...prev, payload.new]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [channelId, users]);

    useEffect(() => {
        if (receiverId) {
            fetchReceiverUser(receiverId);
        }
    }, [receiverId]);

    useEffect(() => {
        if (!thinkTank?.id || isHost) return;

        const checkInitialStatus = async () => {
            const { data } = await supabase
                .from("Live")
                .select("id, status")
                .eq("think_tank_id", thinkTank.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data?.status === "live") {
                setIsLive(true);
                setIsLocked(false);
            } else if (data?.status === "lock") {
                setIsLive(true);
                setIsLocked(true);
            } else {
                setIsLive(false);
                setIsLocked(false);
            }
        };

        checkInitialStatus();

        const liveSub = supabase
            .channel(`live-status-${thinkTank.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "Live",
                    filter: `think_tank_id=eq.${thinkTank.id}`,
                },
                (payload: any) => {
                    const status = payload.new?.status;
                    if (status === "live") {
                        setIsLive(true);
                        setIsLocked(false);
                    } else if (status === "lock") {
                        setIsLive(true);
                        setIsLocked(true);
                    } else {
                        setIsLive(false);
                        setIsLocked(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(liveSub);
        };
    }, [thinkTank?.id, isHost]);

    const addLive = async (think_tank_id: string, thinkTankHost: any, user: any) => {
        try {
            const { data, error } = await supabase
                .from('Live')
                .insert([{
                    host: thinkTankHost,
                    think_tank_id: think_tank_id,
                    status: "live",
                    participants: [user]
                }])
                .select("id")
                .single();

            if (error) {
                console.error("Error starting live call ", error);
                return;
            }

            if (data?.id) {
                window.open(`/channel/video/${data.id}`, '_blank'); // <-- Open with Live row id
            }

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    }

    const addParticipant = async (think_tank_id: string, user: any) => {
        try {
            const { data, error: fetchError } = await supabase
                .from("Live")
                .select("id, participants")
                .eq("think_tank_id", think_tank_id)
                .eq("status", "live")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !data) {
                console.error("No active live session found", fetchError);
                return;
            }

            const currentParticipants = data.participants || [];

            const isAlreadyParticipant = currentParticipants.some((p: any) => p.id === user.id);
            if (isAlreadyParticipant) {
                window.open(`/channel/video/${data.id}`, "_blank");
                return;
            }

            const { error: updateError } = await supabase
                .from("Live")
                .update({
                    participants: [...currentParticipants, user],
                })
                .eq("id", data.id);

            if (updateError) {
                console.error("Failed to update participants", updateError);
                return;
            }

            window.open(`/channel/video/${data.id}`, "_blank");
        } catch (err) {
            console.error("Unexpected error in addParticipant", err);
        }
    };

    const addLiveStream = async (think_tank_id: string, thinkTankHost: any, user: any, streamType: string) => {
        try {
            setStartingLiveStream(true);
            const { data, error } = await supabase
                .from('live_stream')
                .insert([{
                    host: thinkTankHost,
                    room_id: think_tank_id,
                    status: "live",
                    stream_type: streamType,
                    participants: [user]
                }])
                .select("id")
                .single();

            if (error) {
                console.error("Error starting live call ", error);
                return;
            }

            if (data?.id) {
                setLiveStreamId(data.id);
                setCenterView('live');
                dispatch(setLiveStreamStarted({ liveStreamId: data.id, roomId: think_tank_id, streamType: thinkTank.room_type }));
            }

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setStartingLiveStream(false);
        }
    }

    useEffect(() => {
        if (!thinkTank?.id || thinkTank.room_type === "think_tank") return;
        const checkLiveStreamStatus = async () => {
            try {
                const { data } = await supabase
                    .from("live_stream")
                    .select("id, status, stream_type")
                    .eq("room_id", thinkTank.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (data?.status === "live") {
                    setCenterView('live');
                    setLiveStreamId(data.id);
                    dispatch(setLiveStreamStarted({ liveStreamId: data.id, roomId: thinkTank.id, streamType: (data as any).room_type }));
                } else {
                    setCenterView('lobby');
                    setLiveStreamId(null);
                    dispatch(setLiveStreamEnded());
                }
            } catch (err) {
                console.error("Unexpected error while checking live-stream status", err);
            }
        }
        checkLiveStreamStatus()

        // // Set up a polling mechanism as a fallback
        // const pollInterval = setInterval(checkLiveStreamStatus, 5000); // Check every 5 seconds

        const liveSub = supabase
            .channel(`live-stream-status-${thinkTank.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "live_stream",
                    filter: `room_id=eq.${thinkTank.id}`,
                },
                (payload: any) => {
                    const status = payload.new?.status;
                    if (status === "live") {
                        setCenterView('live');
                        setLiveStreamId(payload.new.id);
                        dispatch(setLiveStreamStarted({ liveStreamId: payload.new.id, roomId: thinkTank.id, streamType: thinkTank.room_type }));
                    }
                    if (status === "end") {
                        setCenterView('lobby');
                        setLiveStreamId(null);
                        dispatch(setLiveStreamEnded());
                    }
                }
            )
            .subscribe((status) => {
                console.log("Live stream subscription status:", status);
            });
        return () => {
            // clearInterval(pollInterval);
            supabase.removeChannel(liveSub);
        };
    }, [thinkTank?.id]);

    const steps = [
        {
            title: "First",
            content: (
                <Form
                    form={form}
                    layout="vertical"
                    name="boost_collab_room"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item label="Select Boosting" style={{ width: "100%" }}>
                        <Select
                            allowClear
                            placeholder="Select Boosting"
                            onChange={(value) => {
                                setSelectedBoost(Number(value));
                                setCustomBoost(undefined);
                            }}
                            value={selectedBoost}
                        >
                            <Select.Option value={1}>1x</Select.Option>
                            <Select.Option value={2}>2x</Select.Option>
                            <Select.Option value={3}>3x</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Type Boosting (Custom %)" style={{ width: "100%" }}>
                        <InputNumber
                            placeholder="Write in Percent %"
                            style={{ width: "100%" }}
                            min={1}
                            max={300}
                            onChange={(value) => {
                                setCustomBoost(value!);
                                setSelectedBoost(undefined);
                            }}
                            value={customBoost}
                        />
                    </Form.Item>

                    <div style={{ marginTop: 10 }}>
                        <span style={{ fontWeight: "bold" }}>Price: </span>
                        <span>${calculatePrice().toFixed(2)}</span>
                    </div>
                </Form>
            ),
        },
        {
            title: "Second",
            content: (
                <StripePayment
                    paymentAmount={calculatePrice()}
                    selectedBoost={selectedBoost || customBoost}
                    setShowHireModal={setBoostModal}
                    clientId={profile.profileId}
                    think_tank_id={thinkTankId}
                />
            ),
        }
    ];

    const next = async () => setCurrentStep(currentStep + 1);

    const prev = () => setCurrentStep(currentStep - 1);

    if (centerView === 'live' && (!conversationId && !channelName)) {
        return (
            <>
                <div style={{ position: "relative", height: "100%" }}>
                    {/* <Button style={{ position: "absolute", top: 0, left: 0, margin: 8 }} onClick={() => setCenterView('lobby')}>Back</Button> */}
                    <ProviderStream startingLiveStream={startingLiveStream} liveStreamId={liveStreamId!} roomId={thinkTankId} room={thinkTank} />
                </div>
            </>
        );
    }
    if (centerView === 'lobby' && (!conversationId && !channelName)) {
        return (
            <CollabRoomGridRow>
                <ThemedModal
                    roomType={roomType}
                    themedTitle={
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                                <MdOutlineElectricBolt size={20} />
                            </span>
                            <span>Boost Collab Room</span>
                        </div>
                    }
                    open={boostModal}
                    onCancel={() => setBoostModal(false)}
                    width={600}
                    footer={null}
                >
                    {steps[currentStep].content}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 15, gap: 10 }}>
                        {currentStep > 0 && (
                            <Button style={{ padding: "17px 30px", fontSize: 15 }} onClick={() => prev()}>Back</Button>
                        )}
                        {currentStep < steps.length - 1 && (
                            <Button style={{ padding: "17px 30px", fontSize: 15 }} type="primary" onClick={() => next()} disabled={!selectedBoost && !customBoost}>Next</Button>
                        )}
                    </div>
                </ThemedModal>
                {(isHost || (isLive && !isLocked)) ? (<div className='lobby-header'>
                    {isHost ? (
                        <>
                            <Button icon={<IoVideocamOutline className='icon' />} onClick={() => addLive(thinkTank?.id, thinkTank?.host, { id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "host" })}>
                                Live
                            </Button>
                            <Button icon={<RiArrowUpDoubleFill className='icon' />} onClick={() => setBoostModal(true)}>
                                Boost
                            </Button>
                        </>
                    ) : isLive && !isLocked ? (
                        <Button icon={<IoVideocamOutline className='icon' />} onClick={() => addParticipant(thinkTank?.id, { id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "participant" })}>
                            Join Live
                        </Button>
                    ) : null}
                </div>) : <div></div>}
                <Lobby thinkTankId={thinkTankId} isLiveGoing={isLive && !isLocked} isRoomHost={isHost} thinkTank={thinkTank} addLiveStream={addLiveStream} hostId={thinkTank?.host} />
            </CollabRoomGridRow>
        );
    }

    return (
        <>
            <ThemedModal
                roomType={roomType}
                themedTitle={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                            <MdOutlineElectricBolt size={20} />
                        </span>
                        <span>Boost Collab Room</span>
                    </div>
                }
                open={boostModal}
                onCancel={() => setBoostModal(false)}
                width={600}
                footer={null}
            >
                {steps[currentStep].content}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 15, gap: 10 }}>
                    {currentStep > 0 && (
                        <Button style={{ padding: "17px 30px", fontSize: 15 }} onClick={() => prev()}>Back</Button>
                    )}
                    {currentStep < steps.length - 1 && (
                        <Button style={{ padding: "17px 30px", fontSize: 15 }} type="primary" onClick={() => next()} disabled={!selectedBoost && !customBoost}>Next</Button>
                    )}
                </div>
            </ThemedModal>

            <div className='center-container'>
                <div className='center-content-header'>
                    <div className='center-div-1'>
                        <span className='cnw-user'>
                            {channelName ? (
                                `#${channelName}`
                            ) : otherUser ? (
                                profile.profileType === 'client' ? (
                                    <Link className='cnw-user-name' href={`/profile?visionary=${otherUser.userId}`}>{otherUser.firstName} {otherUser.lastName}</Link>
                                ) : (
                                    `${otherUser.firstName} ${otherUser.lastName}`
                                )
                            ) : (
                                ""
                            )}
                        </span>
                        {/* <RiNotificationOffLine className='icon' /> */}
                    </div>
                    <div className='center-div-2'>
                        {/* <IoNotificationsOutline className='icon' /> */}
                        {isHost ? (
                            <>
                                <Button icon={<IoVideocamOutline className='icon' />} onClick={() => addLive(thinkTank?.id, thinkTank?.host, { id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "host" })}>
                                    Live
                                </Button>
                                <Button icon={<RiArrowUpDoubleFill className='icon' />} onClick={() => setBoostModal(true)}>
                                    Boost
                                </Button>
                            </>
                        ) : isLive && !isLocked ? (
                            <Button icon={<IoVideocamOutline className='icon' />} onClick={() => addParticipant(thinkTank?.id, { id: profile.profileId, name: profile.firstName, picture: profile.profileImage, role: "participant" })}>
                                Join Live
                            </Button>
                        ) : null}
                    </div>
                </div>
                <div>
                    <div id='message-container' ref={messagesEndRef} className='message-container'>
                        {messages && messages.map((message: any) => {
                            const isOwnMessage = message.sender_id === profileId;
                            const user = users[message.sender_id] || {};
                            const repliedMessage = messages.find((msg: any) => msg.id === message.reply_to);

                            return (
                                <div id={`message_${message.id}`} key={message.id} className={`message-parent-div ${isOwnMessage ? "owner-message-parent" : ""}`}>
                                    <div className={`${message.reply_to ? "is-replied" : ""}`}>
                                        {message.reply_to && (
                                            <div className='reply-div' onClick={() => goToFilterData(message.reply_to)}>
                                                {!isOwnMessage && (
                                                    <>
                                                        <BsArrow90DegRight className='reply-icon' />
                                                        <div>
                                                            <Image className='reply-user-image' src={userImage} alt="user-image" width={200} height={200} />
                                                        </div>
                                                    </>
                                                )}
                                                <div className='reply-message-div'>
                                                    <p>@{users[repliedMessage?.sender_id]?.firstName || 'User'}</p>
                                                    {repliedMessage?.message_type === 'text' && (
                                                        <p>{repliedMessage.message?.slice(0, 100) + '...'}</p>
                                                    )}
                                                    {repliedMessage?.message_type === 'audio' && (
                                                        <p><i>🎤 Voice message</i></p>
                                                    )}
                                                    {repliedMessage?.message_type === 'file' && (
                                                        <p><i>📎 File attachment</i></p>
                                                    )}
                                                    {repliedMessage?.message_type === 'video' && (
                                                        <p><i>📹 Video message</i></p>
                                                    )}
                                                    {repliedMessage?.message_type === 'gif' && (
                                                        <p><i>GIF image</i></p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className={`message-div ${isOwnMessage ? "owner-message-div" : ""}`}>
                                            <div>
                                                <Image className='message-user-image' src={userImage} alt="user-image" width={200} height={200} />
                                            </div>
                                            <div>
                                                <div className={`message-sender-div ${isOwnMessage ? "msg-owner-details" : ""}`}>
                                                    {/* {isOwnMessage ? <span>You</span> : <span>{user.firstName + " " + user.lastName}</span>} */}
                                                    {profile.profileType === 'client' && !isOwnMessage ? (
                                                        <Link href={`/profile?visionary=${message.sender_id}`} className='room-message-sender-name'>{isOwnMessage ? "You" : user.firstName + " " + user.lastName}</Link>
                                                    ) : (
                                                        <span className="room-message-sender-name-vs">{isOwnMessage ? "You" : user.firstName + " " + user.lastName}</span>
                                                    )}
                                                    {message.message_type !== 'file' && (<span>{dayjs(message.created_at).calendar(null, {
                                                        sameDay: '[Today] h:mm A',
                                                        lastDay: '[Yesterday] h:mm A',
                                                        lastWeek: 'dddd h:mm A',
                                                        sameElse: 'DD/MM/YYYY h:mm A'
                                                    })}</span>)}
                                                </div>
                                                <MessageRenderer message={message.message} message_type={message.message_type} file_url={message.file_url} isOwnMessage={isOwnMessage} createdAt={message.created_at} />
                                            </div>
                                        </div>
                                        {(() => {
                                            const allReactions = message.reactions || [];
                                            const emojis = ["👍", "😂", "❤️", "😠"];

                                            const activeReactions = emojis.map((type) => {
                                                const count = allReactions.filter((r: any) => r.reaction === type).length;
                                                const isUserReaction = allReactions.some((r: any) => r.user_id === profileId && r.reaction === type);
                                                return count > 0 ? { type, count, isUserReaction } : null;
                                            }).filter(Boolean);

                                            const totalReactions = allReactions.length;

                                            if (activeReactions.length === 0) return null;

                                            return (
                                                <div className={`reaction-display ${isOwnMessage ? "owner-reactions" : "reacted"}`}>
                                                    {activeReactions.map((reaction, idx) => (
                                                        <Popover key={reaction!.type} content={reactionDetail(message)}>
                                                            <span className={`reaction-item ${reaction!.isUserReaction ? 'highlighted-reaction' : ''}`} onClick={() => toggleReaction(message, reaction!.type)}>
                                                                {reaction!.type}
                                                                {keyword && idx === activeReactions.length - 1 && (
                                                                    <span className="total-reaction-count"> {totalReactions}</span>
                                                                )}
                                                            </span>
                                                        </Popover>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    {!isOwnMessage && (
                                        <div className={`reaction-div ${message.reply_to ? "replied-reactions" : ""}`}>
                                            <Popover content={reactionContent(message)}>
                                                <div className='reaction-btn'><MdOutlineEmojiEmotions /></div>
                                            </Popover>
                                            <span className='reply-btn' onClick={() => setReplyTo(message)}><BsReply style={{ fontSize: 16 }} /> Reply</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <InputMessage replyTo={replyTo} users={users} setReplyTo={setReplyTo} setAttachedFile={setAttachedFile} setAudioBlob={setAudioBlob} newMessage={newMessage} setNewMessage={setNewMessage} sendMessage={sendMessage} attachedFile={attachedFile} />
                </div>
            </div>
        </>
    )
}

export default CenterComponent