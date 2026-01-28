'use client'
import React from 'react'
import styles from './style.module.css'
import { Avatar, Input } from 'antd'
import userImg from '@/public/assets/img/userImg.webp'
import { SearchOutlined } from '@ant-design/icons'
import InboxMessages from '../../messages'
import { useAppSelector } from '@/store'

const Messages = () => {
    const profile = useAppSelector((state) => state.auth);

    return (
        <div>
            <span className={styles.pageHeading}>Messages</span>
            {/* <div className={styles.messagesGrid}>
                <div className={styles.allChats}>
                    <div className={styles.header}>
                        <span className={styles.headerTitle}>Unread messages</span>
                        <span className={styles.unreadCountTag}>2</span>
                    </div>
                    <div className={styles.chatsContainer}>
                        <Input suffix={<SearchOutlined />} className={styles.messageSearchInput} placeholder='Search...' />
                        <div className={styles.chatsDiv}>
                            <div className={styles.userChat}>
                                <Avatar src={userImg.src} size={50} />
                                <div className={styles.userDetails}>
                                    <span className={styles.userName}>Devid Heilo</span>
                                    <span className={styles.userMessage}>Hello, how are you?</span>
                                </div>
                                <span className={styles.unreadCountTag}>3</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>Right</div>
            </div> */}

            <InboxMessages roomId={profile.profileId} fromDashboard={true} />
        </div>
    )
}

export default Messages