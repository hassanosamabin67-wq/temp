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
import { MenuOutlined } from '@ant-design/icons'
import OfferSection from './OfferSection'
import { createMessageNotification } from '@/lib/notificationService'
import Link from 'next/link'
import CollabRoomGridRow from '@/Components/UIComponents/CollabRoomGridRow'
import ActionButton from '@/Components/UIComponents/ActionBtn'

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

    useEffect(() => {
        if (messages && messages.length > prevMessageCountRef.current) {
            scrollToBottom();
            prevMessageCountRef.current = messages.length;
        }
    }, [messages]);

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
        if (messagesEndRef?.current) {
            const scroll = messagesEndRef.current.scrollHeight - messagesEndRef.current.clientHeight;
            messagesEndRef.current.scrollTo({
                top: scroll,
                behavior: 'smooth',
            });
        }
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
            <div className="message-box-container">
                <div style={{ padding: 40 }}>
                    <Skeleton active />
                </div>
            </div>
        )
    }

    return (
        <CollabRoomGridRow className='message-box-bg'>
            <div className='message-box-header'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isMobile && (
                        <button
                            className="mobile-menu-button-header"
                            onClick={onOpenDrawer}
                            aria-label="Open conversations"
                        >
                            <MenuOutlined style={{ fontSize: '20px' }} />
                        </button>
                    )}
                    <span className='header-title'>{userDetail?.[receiverId!]?.firstName || "UserName"}</span>
                </div>
                <ActionButton className='offers-btn' onClick={() => setOpenOfferSection(true)}>Offers</ActionButton>
            </div>

            <div className='message-box'>
                <div ref={messagesEndRef} id='message-container' className='message-ref'>
                    {messages && messages.filter((item: any) => item.type === 'message').map((item: any) => {
                        const message = item;
                        const isOwnMessage = message.sender_id === profile.profileId;
                        const messageSender = userDetail[message.sender_id] || {};
                        const repliedMessage = messages.find((msg: any) => msg.id === message.reply_to);
                        const profileImage = messageSender?.profileImage || userImg;

                        return (
                            <div id={`message_${message.id}`} key={message.id} style={{ position: "relative" }} className={`${isOwnMessage ? "owner-message" : "ac-message"} ${message.reply_to ? "replied-message" : ""}`}>
                                {message.reply_to && (
                                    <div className='reply-div' onClick={() => goToFilterData(message.reply_to)}>
                                        {!isOwnMessage && (
                                            <>
                                                <BsArrow90DegRight className='reply-icon' />
                                                {/* <div>
                                                    <Image className='reply-user-image' src={userImg} alt="user-image" width={200} height={200} />
                                                </div> */}
                                            </>
                                        )}
                                        <div className='reply-message-div'>
                                            <p>@{userDetail[repliedMessage?.sender_id]?.firstName || 'User'}</p>
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
                                <div className={`message ${isOwnMessage ? "owner-message" : ""}`}>
                                    <Image className='message-sender-image' src={profileImage} alt='user-img' width={300} height={300} />
                                    <div className={`message-details ${isOwnMessage ? "message-owner-details" : ""}`}>
                                        <div className={`${isOwnMessage ? "owner-message-details" : "message-sender-details"}`}>
                                            {profile.profileType === 'client' && !isOwnMessage ? (
                                                <Link href={`/profile?visionary=${item.sender_id}`} className='message-sender-name'>{isOwnMessage ? "You" : messageSender.firstName + " " + messageSender.lastName}</Link>
                                            ) : (
                                                <span className="message-sender-name-vs">{isOwnMessage ? "You" : messageSender.firstName + " " + messageSender.lastName}</span>
                                            )}
                                            {message.message_type !== 'file' && (<span className='message-time'>{dayjs(message.created_at).calendar(null, {
                                                sameDay: '[Today] h:mm A',
                                                lastDay: '[Yesterday] h:mm A',
                                                lastWeek: 'dddd h:mm A',
                                                sameElse: 'DD/MM/YYYY h:mm A'
                                            })}</span>)}
                                        </div>
                                        {/* <span>{message.message}</span> */}
                                        <MessageRender message={message.message} message_type={message.message_type} file_url={message.file_url} isOwnMessage={isOwnMessage} createdAt={message.created_at} />
                                    </div>
                                </div>
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
                                        <div className={`reaction-display ${isOwnMessage ? "owner-reactions" : "reacted"}`}>
                                            {activeReactions.map((reaction) => (
                                                <Popover key={reaction!.type} content={reactionDetail(message)}>
                                                    <span className={`reaction-item ${reaction!.isUserReaction ? 'highlighted-reaction' : ''}`} onClick={() => toggleReaction(message, reaction!.type)}>
                                                        {reaction!.type}
                                                    </span>
                                                </Popover>
                                            ))}
                                        </div>
                                    );
                                })()}
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
                    {/* {hireOffer && hireOffer.map((offer: any) => (
                        <OfferMessage key={offer.id} userDetail={userDetail} startDate={offer.start_datetime} endDate={offer.end_datetime} offerPrice={offer.price} offerStatus={offer.status} offerSendTime={offer.created_at} clientId={offer.client_id} receiverId={receiverId!} />
                    ))} */}
                </div>
            </div>

            <div className='message-input'>
                {/* <Input className='input-box' inputMode='text' placeholder='Write a message' value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onPressEnter={() => sendMessage(profile.profileId, conversationId)} /> */}
                <MessageInput replyTo={replyTo} users={userDetail} setReplyTo={setReplyTo} setAttachedFile={setAttachedFile} setAudioBlob={setAudioBlob} newMessage={newMessage} setNewMessage={setNewMessage} sendMessage={sendMessage} attachedFile={attachedFile} profileId={profile.profileId} conversationId={conversationId} />
            </div>

            <OfferSection
                openOfferSection={openOfferSection}
                setOpenOfferSection={setOpenOfferSection}
                items={allOffers}
                userDetail={userDetail}
                receiverId={receiverId}
                conversationId={conversationId}
            />
        </CollabRoomGridRow>
    )
}

export default MessageBox