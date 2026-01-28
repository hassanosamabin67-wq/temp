'use client'
import React, { useEffect, useRef, useState } from 'react'
import { IoMdNotificationsOutline } from "react-icons/io";
import styles from './style.module.css'
import { CloseOutlined } from '@ant-design/icons';
import { Badge, Button, Empty } from 'antd';
import { useNotifications } from '@/hooks/useNotifications';
import dayjs from 'dayjs';

const Notification = () => {
    const [showNotification, setShowNotification] = useState(false);
    const { notifications, unreadCount, markAsRead, handleDelete } = useNotifications();

    const notificationRef = useRef<HTMLDivElement>(null);

    const handleNotificationClick = (notification: any) => {
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    }

    useEffect(() => {
        if (showNotification) {
            notifications?.forEach((notification) => {
                if (!notification.is_read) {
                    markAsRead(notification.id);
                }
            });
        }
    }, [showNotification]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotification(false);
            }
        };

        if (showNotification) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotification]);

    return (
        <div className={styles.notificationDiv} ref={notificationRef}>
            <Badge count={unreadCount} className={styles.notificationBadge}>
                <span className={styles.notificationIcon} onClick={() => setShowNotification(!showNotification)}>
                    <IoMdNotificationsOutline />
                </span>
            </Badge>

            {showNotification && (
                <div className={styles.notificationContainer}>
                    {notifications && notifications.length === 0 ? (
                        <Empty description='No notifications yet' />
                    ) : (
                        notifications.map((notification) => (
                            <div key={notification.id} className={styles.notificationParent}>
                                <div onClick={() => handleNotificationClick(notification)} className={styles.notifications}>
                                    <div className={styles.notification}>
                                        <div className={styles.notificationDetail}>
                                            <span className={styles.notificationTitle}>{notification.title}</span>
                                            <p className={styles.notificationContent}>{notification.message}</p>
                                        </div>
                                        <span className={styles.notificationDate}>{dayjs(notification.created_at).format('MMM DD, YYYY')}</span>
                                    </div>
                                </div>
                                <Button className={styles.closeIcon} onClick={() => handleDelete(notification.id)}>
                                    <CloseOutlined />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Notification;