'use client'
import React from 'react'
import userImg from '@/public/assets/img/userImg.webp'
import { useAppSelector } from '@/store';
import { useSearchParams } from 'next/navigation';
import { SearchOutlined } from '@ant-design/icons';
import UserAvatar from '@/Components/UIComponents/UserAvatar';

const Conversations = ({ openConversation, allConversation, userDetail, activeConversationId }: any) => {
    const profile = useAppSelector((state) => state.auth);
    const searchParams = useSearchParams();

    return (
        <>
            <div className="search-wrapper">
                <SearchOutlined className="search-icon" style={{ fontSize: '18px' }} />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="search-input"
                />
            </div>

            <div className="conversations-list">
                {allConversation && allConversation.length > 0 ? (allConversation.map((conv: any) => {
                    const otherUserId = conv.user1_id === profile.profileId ? conv.user2_id : conv.user1_id;
                    const isActive = conv.id === activeConversationId;

                    return (
                        <div
                            key={conv.id}
                            className={`conversation-item ${isActive ? 'active' : ''}`}
                            onClick={() => openConversation(otherUserId, profile.profileId)}
                        >
                            <div className="conversation-avatar-wrapper">
                                <img
                                    src={userDetail[otherUserId]?.profileImage || userImg.src}
                                    alt="user"
                                    className="conversation-avatar"
                                />
                                {userDetail[otherUserId]?.is_online && <div className="online-indicator" />}
                            </div>
                            <div className="conversation-info">
                                <div className="conversation-header">
                                    <h3 className="conversation-name">{userDetail[otherUserId]?.firstName} {userDetail[otherUserId]?.lastName}</h3>
                                    <span className="conversation-time">
                                        {conv.lastMessage?.created_at ? new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="conversation-footer">
                                    <p className="conversation-message">
                                        {conv.lastMessage?.message
                                            ? (conv.lastMessage.message.length > 30 ? conv.lastMessage.message.substring(0, 30) + '...' : conv.lastMessage.message)
                                            : "No messages yet"}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <span className="unread-badge">{conv.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No Conversations</div>
                )}
            </div>
        </>
    )
}

export default Conversations