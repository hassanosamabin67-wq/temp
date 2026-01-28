'use client';
import { useEffect, useRef, useState } from "react";
import { BsFillSendFill } from "react-icons/bs";
import { supabase } from "@/config/supabase";

function ChatBox({ channelName, userId }: { channelName: string; userId: string | any }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const prevMessageCountRef = useRef(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data } = await supabase
                .from("Live")
                .select("participants, messages")
                .eq("id", channelName)
                .single();

            if (data?.participants) setParticipants(data.participants);
            if (data?.messages) setMessages(data.messages);
        };

        fetchInitialData();

        const sub = supabase
            .channel(`live-chat-${channelName}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'Live',
                    filter: `id=eq.${channelName}`
                },
                (payload) => {
                    setMessages(payload.new.messages || []);
                    setParticipants(payload.new.participants || []);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
    }, [channelName]);

    useEffect(() => {
        if (messages && messages.length > prevMessageCountRef.current) {
            scrollToBottom();
            prevMessageCountRef.current = messages.length;
        }
    }, [messages]);

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

        const user = participants.find((p) => p.id === userId);
        const userName = user?.name || 'Unknown';

        const newMessage = {
            id: userId,
            userName,
            text: messageText,
        };

        const { data, error: fetchError } = await supabase
            .from("Live")
            .select("messages")
            .eq("id", channelName)
            .single();

        if (fetchError) {
            console.error("Error fetching messages:", fetchError);
            return;
        }

        const currentMessages = data?.messages || [];
        const updatedMessages = [...currentMessages, newMessage];

        const { error: updateError } = await supabase
            .from("Live")
            .update({ messages: updatedMessages })
            .eq("id", channelName);

        if (updateError) {
            console.error('Message send failed:', updateError);
        } else {
            setMessage('');
        }
    };

    const pinMessage = async (index: number) => {
        const updatedMessages = [...messages];
        updatedMessages[index].pinned = !updatedMessages[index].pinned;

        const { error } = await supabase
            .from("Live")
            .update({ messages: updatedMessages })
            .eq("id", channelName);

        if (error) {
            console.error('Failed to pin message:', error);
        } else {
            setMessages(updatedMessages);
        }
    };

    const scrollToMessage = (index: number) => {
        const element = document.getElementById(`message_${index}`);
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

    return (
        <div className="chat-box-container">
            <div id='message-container' ref={messagesEndRef} className="messages-container">
                <div className="pinned-section">
                    {messages
                        .map((msg, idx) => ({ ...msg, originalIndex: idx }))
                        .filter(msg => msg.pinned)
                        .map((msg, id) => (
                            <div
                                key={`pinned-${msg.originalIndex}`}
                                className="pinned-msg"
                                onClick={() => scrollToMessage(id)}
                                style={{ wordBreak: "break-word" }}
                            >
                                📌 <strong>{msg.userName}</strong>: {msg.text}
                            </div>
                        ))}
                </div>
                {messages.map((msg, idx) => (
                    <div key={idx} id={`message_${idx}`} className={`message ${msg.id === userId ? "owner-message" : ""} ${msg.pinned ? "pinned-message" : ""}`}>
                        <span style={{ wordBreak: "break-word" }}>
                            <strong>{msg.id === userId ? "You" : msg.userName}:</strong> {msg.text}
                            {msg.pinned && (<span className="pin-icon">📌</span>)}
                        </span>
                        <button className="pin-btn" onClick={() => pinMessage(idx)}>{msg.pinned ? "unpinned" : "pin"}</button>
                    </div>
                ))
                }
            </div>
            <div className="message-input-div">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(message)}
                    placeholder="Type your message"
                    className="message-input"
                />
                <button className="message-send-btn" onClick={() => sendMessage(message)}>
                    <BsFillSendFill />
                </button>
            </div>
        </div>
    );
}

export default ChatBox;