'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Popover, Skeleton } from 'antd'
import userImg from '@/public/assets/img/userImg.webp'
import Image from 'next/image'
import { supabase } from '@/config/supabase'
import { useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/store'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import MessageInput from './MessageInput'
import MessageRender from './MessageRender'
import { MdOutlineEmojiEmotions } from 'react-icons/md'
import { BsArrow90DegRight, BsReply } from 'react-icons/bs'
import { MenuOutlined, PhoneOutlined, VideoCameraOutlined, InfoCircleOutlined, MoreOutlined } from '@ant-design/icons'
import OfferSection from './OfferSection'
import { createMessageNotification } from '@/lib/notificationService'
import Link from 'next/link'
import ActionButton from '@/Components/UIComponents/ActionBtn'
import OfferMessage from './OfferMessage'

dayjs.extend(relativeTime)
dayjs.extend(calendar)

const MessageBox = ({ conversationId, userDetail, isMobile, onOpenDrawer }: any) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const searchParams = useSearchParams();
    const receiverId = searchParams.get("ch")
    const profile = useAppSelector((state) => state.auth);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const prevMessageCountRef = useRef(0);
    const [openOfferSection, setOpenOfferSection] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false)

    useEffect(() => {
        if (!conversationId) return;

        getMessages(conversationId);

        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload) => {
                    if (payload.new.inbox_conversation_id === conversationId) {
                        const newMessageWithType = { ...payload.new, type: 'message' };
                        setMessages((prev: any) => [...prev, newMessageWithType]);
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                (payload) => {
                    if (payload.new.inbox_conversation_id === conversationId) {
                        setMessages((prev: any) =>
                            prev.map((msg: any) =>
                                msg.id === payload.new.id
                                    ? { ...msg, ...payload.new, type: 'message' }
                                    : msg
                            )
                        );
                    }
                }
            );

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, receiverId]);

    // useEffect(() => {
    //     if (messages && messages.length > prevMessageCountRef.current) {
    //         scrollToBottom();
    //         prevMessageCountRef.current = messages.length;
    //     }
    // }, [messages]);

    const allOffers = React.useMemo(
        () =>
            messages
                .filter((x: any) => x.type === "offer" || x.type === "service_offer")
                .sort(
                    (a: any, b: any) =>
                        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                ),
        [messages]
    );

    const getMessages = async (conversationId: string) => {
        try {
            setLoadingMessages(true);

            // 1) Don't run the offer queries until we know both ids
            if (!receiverId || !profile?.profileId) {
                // Still load chat messages so the thread appears
                const { data: messageData } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("inbox_conversation_id", conversationId)
                    .order("created_at", { ascending: true });

                const typedMessages = (messageData || []).map(m => ({ ...m, type: "message" }));
                setMessages(typedMessages);
                return;
            }

            // Parallel fetches
            const [{ data: messageData, error: msgErr }, { data: orderData, error: orderErr }, { data: serviceOrderData, error: svcErr }] =
                await Promise.all([
                    supabase
                        .from("messages")
                        .select("*")
                        .eq("inbox_conversation_id", conversationId)
                        .order("created_at", { ascending: true }),
                    supabase
                        .from("order")
                        .select("*")
                        .or(
                            `and(client_id.eq.${profile.profileId},visionary_id.eq.${receiverId}),and(client_id.eq.${receiverId},visionary_id.eq.${profile.profileId})`
                        ),
                    supabase
                        .from("service_orders")
                        .select("*")
                        .or(
                            `and(client_id.eq.${profile.profileId},visionary_id.eq.${receiverId}),and(client_id.eq.${receiverId},visionary_id.eq.${profile.profileId})`
                        ),
                ]);

            if (msgErr) console.error("Error Fetching messages: ", msgErr);
            if (orderErr) console.error("Error Fetching Order: ", orderErr);
            if (svcErr) console.error("Error Fetching Service Orders: ", svcErr);

            const orderIds = (orderData || []).map(o => o.id);

            // 2) Only fetch milestones if we have orderIds
            let milestoneData: any[] = [];
            if (orderIds.length > 0) {
                const { data, error } = await supabase
                    .from("milestone_payment")
                    .select("*")
                    .in("order_id", orderIds);
                if (error) console.error("Error Fetching Milestones: ", error);
                milestoneData = data || [];
            }

            const sortedMilestones = [...milestoneData].sort(
                (a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()
            );

            const milestonesByOrderId = sortedMilestones.reduce((acc, m) => {
                (acc[m.order_id] ||= []).push(m);
                return acc;
            }, {} as Record<string, any[]>);

            const typedMessages = (messageData || []).map(m => ({ ...m, type: "message" }));
            const typedOffers = (orderData || []).map(o => ({
                ...o,
                type: "offer",
                milestone: milestonesByOrderId[o.id] || [],
            }));
            const typedServiceOffers = (serviceOrderData || []).map(s => ({ ...s, type: "service_offer" }));

            // 3) Defensive sort: fall back to other dates if created_at is missing
            const getWhen = (x: any) =>
                x.created_at ||
                x.start_date ||
                x.start_datetime ||
                x.updated_at ||
                0;

            const combined = [...typedMessages, ...typedOffers, ...typedServiceOffers].sort(
                (a, b) => new Date(getWhen(a)).getTime() - new Date(getWhen(b)).getTime()
            );

            setMessages(combined);
        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const sendMessage = async (profileId: any, conversationId: string, setIsAudioStop: (arg: boolean) => void, setRecording: (arg: boolean) => void) => {
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
            sender_id: profileId,
            message_type: messageType,
            is_read: false,
            ...(replyTo && { reply_to: replyTo.id }),
            ...(fileUrl && { file_url: fileUrl }),
        };

        const insertData = { ...messagePayload, receiver_id: receiverId, inbox_conversation_id: conversationId };

        const { error } = await supabase.from("messages").insert([insertData]);

        if (error) {
            console.error('Message sending failed', error);
            return;
        }

        await createMessageNotification(profileId, `K.${profile.firstName}`, receiverId!, newMessage.trim(), conversationId)

        setNewMessage("");
        setReplyTo(null);
        setAttachedFile(null);
        setAudioBlob(null);
        setIsAudioStop(false)
        setRecording(false)
    };

    const scrollToBottom = () => {
        // if (messagesEndRef?.current) {
        //     // Using logic from previous file but ensuring it works with new layout
        //     // Maybe standard scrollTo works better.
        //     messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        // }
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

        const { error } = await supabase
            .from("messages")
            .update({ reactions: updatedReactions })
            .eq('id', message.id);

        if (error) {
            console.error("Error updating reactions:", error);
        }

        setMessages((prevMessages: any[]) =>
            prevMessages.map((msg) =>
                msg.id === message.id ? { ...msg, reactions: updatedReactions } : msg
            )
        );
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
            const user = userDetail[reaction.user_id];
            const name = user ? reaction.user_id === profile.profileId ? "You Reacted" : user.firstName : "User";

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

    const goToFilterData = (id: string | number) => {
        const element = document.getElementById(`message_${id}`);
        const container = document.getElementById("message-container");

        if (element && container) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        const markMessagesAsRead = async () => {
            if (!conversationId || !profile?.profileId) return;

            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('inbox_conversation_id', conversationId)
                .eq('receiver_id', profile.profileId)
                .eq('is_read', false);

            if (error) {
                console.error("Failed to mark messages as read:", error);
            } else {
                console.log("Marked messages as read for conversation:", conversationId);
            }
        };

        markMessagesAsRead();
    }, [conversationId, profile?.profileId]);

    if (loadingMessages) {
        return (
            <div className="chat-area empty">
                <Skeleton active />
            </div>
        )
    }

    return (
        <>
            <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isMobile && (
                        <button
                            className="back-button"
                            onClick={onOpenDrawer}
                            style={{ marginRight: '10px' }}
                        >
                            <MenuOutlined size={20} />
                        </button>
                    )}
                    <div className="chat-avatar-wrapper">
                        <img
                            src={userDetail?.[receiverId!]?.profileImage || userImg.src}
                            alt="User"
                            className="chat-avatar"
                        />
                        {userDetail?.[receiverId!]?.is_online && <div className="online-indicator" />}
                    </div>
                    <div className="chat-user-details">
                        <h2 className="chat-user-name">{userDetail?.[receiverId!]?.firstName || "UserName"} {userDetail?.[receiverId!]?.lastName}</h2>
                        <span className="chat-user-status">
                            {userDetail?.[receiverId!]?.is_online ? 'Active now' : `Last seen: ${dayjs(userDetail?.[receiverId!]?.last_seen).fromNow()}`}
                        </span>
                    </div>
                </div>
                <div className="chat-actions">
                    <button className="chat-action-btn">
                        <PhoneOutlined />
                    </button>
                    <button className="chat-action-btn">
                        <VideoCameraOutlined />
                    </button>
                    <button className="chat-action-btn">
                        <InfoCircleOutlined />
                    </button>
                    <button className="chat-action-btn offer-btn" onClick={() => setOpenOfferSection(true)}>
                        Offers
                    </button>
                </div>
            </div>

            <div className="messages-container" id="message-container">
                <div className="messages-list">
                    {messages && messages.map((item: any) => {
                        // Handle Offer items (keeping logical flow)
                        if (item.type === 'offer' || item.type === 'service_offer') {
                            // Render offers inside the chat list ? 
                            // Original code filtered `filtered(x => x.type === 'message')` for the main list,
                            // and separately rendered `hireOffer` map (commented out in original).
                            // But `getMessages` fetches offers and puts them in `messages`.
                            // In original code: `{messages && messages.filter((item: any) => item.type === 'message').map...}`
                            // It seems offers were NOT shown in the message list in the original code, only in the OfferSection via `allOffers`.
                            // So I should keep filtering only 'message' type here.
                            return null;
                        }

                        const message = item;
                        const isOwnMessage = message.sender_id === profile.profileId;
                        const messageSender = userDetail[message.sender_id] || {};
                        const repliedMessage = messages.find((msg: any) => msg.id === message.reply_to);
                        const profileImage = messageSender?.profileImage || userImg.src;

                        return (
                            <div
                                key={message.id}
                                id={`message_${message.id}`}
                                className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                            >
                                {!isOwnMessage && (
                                    <img
                                        src={profileImage}
                                        alt={messageSender.firstName}
                                        className="message-avatar"
                                    />
                                )}
                                <div className="message-content">
                                    {message.reply_to && (
                                        <div className='reply-div' onClick={() => goToFilterData(message.reply_to)} style={{ marginBottom: 5, borderRadius: 8 }}>
                                            <div className='reply-message-div'>
                                                <p style={{ fontWeight: 600 }}>@{userDetail[repliedMessage?.sender_id]?.firstName || 'User'}</p>
                                                <p>{repliedMessage?.message?.slice(0, 30)}...</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="message-bubble">
                                        <MessageRender
                                            message={message.message}
                                            message_type={message.message_type}
                                            file_url={message.file_url}
                                            isOwnMessage={isOwnMessage}
                                            createdAt={message.created_at}
                                        />
                                    </div>
                                    <span className="message-time">
                                        {dayjs(message.created_at).format('h:mm A')}
                                    </span>

                                    {/* Reactions */}
                                    {(() => {
                                        const allReactions = message.reactions || [];
                                        const emojis = ["👍", "😂", "❤️", "😠"];
                                        const activeReactions = emojis.map((type) => {
                                            const count = allReactions.filter((r: any) => r.reaction === type).length;
                                            const isUserReaction = allReactions.some((r: any) => r.user_id === profile.profileId && r.reaction === type);
                                            return count > 0 ? { type, count, isUserReaction } : null;
                                        }).filter(Boolean);

                                        if (activeReactions.length === 0) return null;
                                        return (
                                            <div className="reaction-display" style={{ position: 'relative', marginTop: -10, alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                                                {activeReactions.map((reaction: any) => (
                                                    <Popover key={reaction.type} content={reactionDetail(message)}>
                                                        <span style={{ marginRight: 3, cursor: 'pointer' }} onClick={() => toggleReaction(message, reaction.type)}>
                                                            {reaction.type} {reaction.count}
                                                        </span>
                                                    </Popover>
                                                ))}
                                            </div>
                                        )
                                    })()}
                                </div>

                                {/* Hover Actions (Reply/React) */}
                                {!isOwnMessage && (
                                    <div className="message-actions" style={{ display: 'flex', flexDirection: 'column', gap: 5, marginLeft: 5, opacity: 0.5 }}>
                                        <Popover content={reactionContent(message)}>
                                            <MdOutlineEmojiEmotions style={{ cursor: 'pointer' }} />
                                        </Popover>
                                        <BsReply style={{ cursor: 'pointer' }} onClick={() => setReplyTo(message)} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="message-input-container">
                <MessageInput
                    replyTo={replyTo}
                    users={userDetail}
                    setReplyTo={setReplyTo}
                    setAttachedFile={setAttachedFile}
                    setAudioBlob={setAudioBlob}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    sendMessage={sendMessage}
                    attachedFile={attachedFile}
                    profileId={profile.profileId}
                    conversationId={conversationId}
                />
            </div>

            <OfferSection
                openOfferSection={openOfferSection}
                setOpenOfferSection={setOpenOfferSection}
                items={allOffers}
                userDetail={userDetail}
                receiverId={receiverId}
                conversationId={conversationId}
            />
        </>
    )
}

export default MessageBox
