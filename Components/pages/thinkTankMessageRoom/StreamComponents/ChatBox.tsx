import React, { useEffect, useRef, useState } from 'react';
import { Empty, Mentions, Popover } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import Image from 'next/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { MdOutlineEmojiEmotions } from 'react-icons/md';
import styles from './style.module.css'

dayjs.extend(relativeTime);
dayjs.extend(calendar);

const ChatBox = ({ roomId, hostId, roomType }: { roomId: string; hostId: string; roomType: string; }) => {
    const profile = useAppSelector((state) => state.auth);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const prevMessageCountRef = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const reactionEmojis = ['🔥', '❤️', '👏', '👍', '😂', '😠'];

    // Parse mentions to add K. prefix and styling
    const parseMentions = (text: string) => {
        if (!text) return text;

        // Match @mentions and replace with K. prefix
        return text.replace(/@(\w+(?:\s+\w+)*)/g, (match, name) => {
            return `<span style="color: #1890ff; font-weight: 600;">@K.${name}</span>`;
        });
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

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;

        // Store the actual message with @ mentions (without K. prefix in database)
        const newMessage = {
            room_id: roomId,
            profileImg: profile.profileImage,
            user_id: profile.profileId,
            host: hostId,
            message: messageText,
            user_name: profile.firstName, // Store actual name without K. prefix
        };

        const { error } = await supabase
            .from('stream_messages')
            .insert([newMessage])
            .eq('room_id', roomId);

        if (error) {
            console.error('Message send failed:', error);
            return;
        } else {
            setNewMessage('');
        }
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('stream_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Messages fetch failed:', error);
            return;
        } else {
            setMessages(data);
        }
    };

    const getParticipants = async () => {
        try {
            const { data, error } = await supabase
                .from('think_tank_participants')
                .select('*, users(userId, profileImage, firstName, lastName)')
                .eq('think_tank_id', roomId)

            if (error) {
                console.error('Error fetching participants:', error);
                return null;
            }

            const users = data.map((entry: any) => ({
                id: entry.users.userId,
                name: `${entry.users.firstName}`, // Store actual name
            }));

            setParticipants(users);

        } catch (err) {
            console.error('Error fetching participants:', err);
        }
    }

    useEffect(() => {
        if (messages && messages.length > prevMessageCountRef.current) {
            scrollToBottom();
            prevMessageCountRef.current = messages.length;
        }
    }, [messages]);

    useEffect(() => {
        if (!roomId) return;
        fetchMessages();
        getParticipants();

        const sub = supabase
            .channel('stream_messages')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stream_messages' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMsg = {
                            ...payload.new,
                            reactions: payload.new.reactions || [],
                        };
                        setMessages((prevMessages) => [...prevMessages, newMsg]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMsg: any = {
                            ...payload.new,
                            reactions: payload.new.reactions || [],
                        };
                        setMessages((prevMessages) =>
                            prevMessages.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
    }, [roomId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const addEmoji = (emoji: any) => {
        setNewMessage((prev: any) => prev + emoji.native);
        setShowEmojiPicker(false);
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
                updatedReactions = currentReactions.map((r: any) =>
                    r.user_id === userId ? { ...r, reaction: reactionType } : r
                );
            }
        } else {
            updatedReactions = [
                ...currentReactions,
                { user_id: userId, user_name: profile.firstName, reaction: reactionType },
            ];
        }

        const { error } = await supabase
            .from('stream_messages')
            .update({ reactions: updatedReactions })
            .eq('id', message.id);

        if (error) {
            console.error('Error updating reactions:', error);
            return;
        }
    };

    const reactionContent = (message: any) => (
        <div style={{ display: 'flex', gap: 5 }}>
            {reactionEmojis.map((reaction) => (
                <span
                    key={reaction}
                    onClick={() => toggleReaction(message, reaction)}
                    style={{ cursor: 'pointer', fontSize: '20px' }}
                >
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
            const user = reaction.user_name;
            const userId = reaction.user_id;
            // Add K. prefix to reaction detail
            const name = user ? (userId === profile.profileId ? 'You Reacted' : `K.${user}`) : 'User';

            if (!emojiGroups[emoji]) emojiGroups[emoji] = [];
            emojiGroups[emoji].push(name);
        });

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(emojiGroups).map(([emoji, names]) => (
                    <div key={emoji} style={{ display: 'flex', gap: 8 }}>
                        <span>{names.join(', ')}</span>
                        <span>{emoji}</span>
                    </div>
                ))}
            </div>
        );
    };

    const getUserReaction = (message: any) => {
        const userReaction = message.reactions?.find((r: any) => r.user_id === profile.profileId);
        return userReaction?.reaction;
    };

    return (
        <div className={styles.chatBoxContent}>
            <div
                ref={messagesEndRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    ...(roomType === 'art_exhibit' ? { maxHeight: "100%" } : { maxHeight: 350 })
                }}
            >
                {messages && messages.length > 0 ? (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '12px',
                                borderRadius: '8px',
                            }}
                        >
                            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                {message.profileImg ? (
                                    <Image
                                        src={message.profileImg}
                                        alt="profile"
                                        style={{ borderRadius: '100%' }}
                                        width={30}
                                        height={30}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: '#4a4a4a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {message.user_name.charAt(0)}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        {/* Display K. prefix with username */}
                                        <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                            K.{message.user_name}
                                        </span>
                                    </div>
                                    <p
                                        style={{ color: '#ddd', margin: 0, fontSize: '12px', lineHeight: '1.5', wordBreak: "break-word" }}
                                        dangerouslySetInnerHTML={{ __html: parseMentions(message.message) }}
                                    />
                                    {message.reactions && message.reactions.length > 0 && (
                                        <Popover content={reactionDetail(message)} trigger="hover">
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                {Object.entries(
                                                    message.reactions.reduce((acc: any, r: any) => {
                                                        acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                                                        return acc;
                                                    }, {})
                                                ).map(([emoji, count]: any) => (
                                                    <span
                                                        key={emoji}
                                                        style={{
                                                            background: getUserReaction(message) === emoji ? '#3a3a3a' : '#2a2a2a',
                                                            border: '1px solid #4a4a4a',
                                                            borderRadius: '12px',
                                                            padding: '2px 8px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() => toggleReaction(message, emoji)}
                                                    >
                                                        {emoji} {count}
                                                    </span>
                                                ))}
                                            </div>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <Popover content={reactionContent(message)} trigger="click">
                                <button
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        alignSelf: "flex-end"
                                    }}
                                >
                                    <MdOutlineEmojiEmotions />
                                </button>
                            </Popover>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Empty description={null} />
                        <span style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>
                            No messages yet...
                        </span>
                    </div>
                )}
            </div>
            <div style={{ padding: '10px', background: '#2a2a2a', borderTop: '1px solid #3a3a3a', position: 'relative' }}>
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '70px', left: '16px', zIndex: 10 }}>
                        <Picker data={data} onEmojiSelect={addEmoji} />
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiPicker(!showEmojiPicker);
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: '24px',
                        }}
                    >
                        <MdOutlineEmojiEmotions />
                    </button>
                    <Mentions
                        placeholder="Write message or type @ to mention"
                        value={newMessage}
                        onChange={setNewMessage}
                        onPressEnter={() => sendMessage(newMessage)}
                        style={{ flex: 1 }}
                        options={[
                            {
                                key: 'all',
                                value: 'All',
                                label: 'All',
                            },
                            ...participants.map((user) => ({
                                key: user.id.toString(),
                                value: user.name, // Store actual name in message
                                label: `K.${user.name}`, // Display K. prefix in dropdown
                            })),
                        ]}
                    />
                    <button
                        onClick={() => sendMessage(newMessage)}
                        style={{
                            background: '#1890ff',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            fontSize: '16px',
                        }}
                    >
                        <SendOutlined />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;