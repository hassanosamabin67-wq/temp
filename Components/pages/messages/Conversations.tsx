'use client'
import React from 'react'
import userImg from '@/public/assets/img/userImg.webp'
import { useAppSelector } from '@/store';
import { useSearchParams } from 'next/navigation';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import UserAvatar from '@/Components/UIComponents/UserAvatar';
import CollabRoomGridRow from '@/Components/UIComponents/CollabRoomGridRow';

const Conversations = ({ openConversation, allConversation, userDetail }: any) => {
    const profile = useAppSelector((state) => state.auth);
    const searchParams = useSearchParams();
    const receiverId = searchParams.get("ch")

    return (
        <CollabRoomGridRow className='conversations-container'>
            <div className='message-box-header'>
                <span className='header-title'>Conversations</span>
            </div>
            <div>
                <div className='message-search-input-div'>
                    <Input suffix={<SearchOutlined />} className='message-search-input' placeholder='Search...' />
                </div>
                <ul className='all-conversations'>
                    {allConversation ? (allConversation.map((conv: any) => {
                        const otherUserId = conv.user1_id === profile.profileId ? conv.user2_id : conv.user1_id;
                        return (
                            <li key={conv.id} className={`conversation ${otherUserId === receiverId ? "active-conversation" : ""}`} onClick={() => openConversation(otherUserId, profile.profileId)}>
                                <div className='user-chat-container'>
                                    {/* <div className='user-img-div'>
                                    <Image className='conversation-sender-image' src={userDetail[otherUserId]?.profileImage || userImg} alt='user-img' width={300} height={300} />
                                    <span className='online-dot'><GoDotFill /></span>
                                </div> */}
                                    <UserAvatar src={userDetail[otherUserId]?.profileImage} lastSeen={userDetail[otherUserId]?.last_seen} fallbackSrc={userImg} />
                                    <div className='conversation-sender-detail'>
                                        <span className='conversation-sender-name'>{userDetail[otherUserId]?.firstName} {userDetail[otherUserId]?.lastName}</span>
                                        <span className='last-message'>
                                            {conv.lastMessage?.message
                                                ? conv.lastMessage.message.split(' ').slice(0, 3).join(' ') + '...'
                                                : "No messages yet"}
                                        </span>
                                    </div>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className="unread-count-tag">{conv.unreadCount}</span>
                                )}
                            </li>
                        )
                    })) : (
                        <div>No Message</div>
                    )}
                </ul>
            </div>
        </CollabRoomGridRow>
    )
}

export default Conversations