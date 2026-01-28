import React, { useEffect, useRef, useState } from 'react';
import styles from './style.module.css';
import { BsChat } from "react-icons/bs";
import { Empty, Mentions, Popover } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import Image from 'next/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { MdOutlineEmojiEmotions } from 'react-icons/md';
import MessageReaction from '../MessageReaction';

dayjs.extend(relativeTime)
dayjs.extend(calendar)

const ChatQnA = ({ roomId, hostId }: { roomId: string, hostId: string }) => {
  const profile = useAppSelector((state) => state.auth);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const prevMessageCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const reactionEmojis = ['🔥', '❤️', '👏', "👍", "😂", "😠"]

  const parseMentions = (text: string) => {
    if (!text) return text;

    return text.replace(/@[^\s@]+(?:\s[^\s@]+)*/g, (match) => {
      return `<span class="mention">${match}</span>`;
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

    const newMessage = {
      room_id: roomId,
      profileImg: profile.profileImage,
      user_id: profile.profileId,
      host: hostId,
      message: messageText,
      user_name: profile.firstName + ' ' + profile.lastName
    };

    const { error } = await supabase
      .from("stream_messages")
      .insert([newMessage])
      .eq("room_id", roomId)

    if (error) {
      console.error('Message send failed:', error);
      return;
    } else {
      setNewMessage('');
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("stream_messages")
      .select("*")
      .eq("room_id", roomId);

    if (error) {
      console.error('Messages fetch failed:', error);
      return;
    } else {
      setMessages(data);
    }
  }

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
        name: `${entry.users.firstName} ${entry.users.lastName}`,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = {
              ...payload.new,
              reactions: payload.new.reactions || []
            };
            setMessages(prevMessages => [...prevMessages, newMsg]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg: any = {
              ...payload.new,
              reactions: payload.new.reactions || []
            };
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === updatedMsg.id ? updatedMsg : msg
              )
            );
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    }
  }, [roomId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        updatedReactions = currentReactions.map((r: any) => r.user_id === userId ? { ...r, reaction: reactionType } : r);
      }
    } else {
      updatedReactions = [...currentReactions, { user_id: userId, user_name: profile.firstName, reaction: reactionType }];
    }

    const { error } = await supabase
      .from('stream_messages')
      .update({ reactions: updatedReactions })
      .eq('id', message.id);

    if (error) {
      console.error("Error updating reactions:", error);
      return;
    }
  };

  const reactionContent = (message: any) => (
    <div style={{ display: "flex", gap: 5 }}>
      {reactionEmojis.map((reaction) => (
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
      const user = reaction.user_name;
      const userId = reaction.user_id;
      const name = user ? userId === profile.profileId ? "You Reacted" : user : "User";

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

  return (
    <div className={styles.chatQnA}>
      <div className={styles.chatQnAMessages} ref={messagesEndRef}>
        {(messages && messages.length > 0) ? (
          messages.map((message) => (
            <div key={message.id} className={styles.chatQnADiv}>
              <div className={styles.chatQnAMessage}>
                {message.profileImg ? <Image src={message.profileImg} alt='profile' style={{ borderRadius: "100%" }} width={30} height={30} />
                  : <span className={styles.chatQnAMessageIcon}>{message.user_name.charAt(0)}</span>}
                <div className={styles.chatQnAMessageContent}>
                  <div className={styles.chatQnAMessageContentHeader}>
                    <span className={styles.chatQnAMessageContentUserName}>{message.user_name}</span>
                    <span className={styles.chatQnAMessageContentTime}>{dayjs(message.created_at).calendar(null, {
                      sameDay: '[Today] h:mm A',
                      lastDay: '[Yesterday] h:mm A',
                      lastWeek: 'dddd h:mm A',
                      sameElse: 'DD/MM/YYYY h:mm A'
                    })}</span>
                  </div>
                  <p
                    className={styles.chatQnAMessageContentText}
                    dangerouslySetInnerHTML={{ __html: parseMentions(message.message) }}
                  />
                </div>
              </div>
              <div className={styles.emojiDiv}>
                <MessageReaction message={message} profileId={profile.profileId!} reactionDetail={reactionDetail} toggleReaction={toggleReaction} emojis={reactionEmojis} />
                <div>
                  <Popover content={reactionContent(message)}>
                    <button className={styles.emojiBtn}><MdOutlineEmojiEmotions /></button>
                  </Popover>
                </div>
              </div>
            </div>
          )
          )) : (
          <div>
            <Empty description={null} />
            <span style={{ textAlign: "center", display: "block", color: "white", fontWeight: 600, fontSize: 20 }}>Now message yet.....</span>
          </div>
        )}
      </div>
      <div className={styles.chatQnAInput}>
        {showEmojiPicker && (
          <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '60px', zIndex: 10 }}>
            <Picker data={data} onEmojiSelect={addEmoji} />
          </div>
        )}
        <button className={styles.inputEmoji}
          onClick={(e) => {
            e.stopPropagation();
            setShowEmojiPicker(!showEmojiPicker);
          }}
        >
          <MdOutlineEmojiEmotions />
        </button>
        <Mentions
          placeholder='Write message or type @ to mention'
          className={styles.chatQnAInputInput}
          value={newMessage}
          onChange={setNewMessage}
          onPressEnter={() => sendMessage(newMessage)}
          options={[{
            key: 'all',
            value: 'All',
            label: 'All'
          }, ...participants.map(user => ({
            key: user.id.toString(),
            value: user.name,
            label: user.name,
          }))]
          }
        />
        <button className={styles.chatQnAInputButton} onClick={() => sendMessage(newMessage)}><SendOutlined /></button>
      </div>
    </div>
  );
};

export default ChatQnA; 