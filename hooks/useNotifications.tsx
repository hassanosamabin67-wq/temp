import { supabase } from '@/config/supabase';
import { deleteNotification, getNotifications } from '@/lib/notificationService';
import { useAppSelector } from '@/store';
import { useEffect, useState } from 'react';

export interface Notification {
    id: string;
    user_id: string;
    receiverId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
    action_url?: string;
    priority: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const user = useAppSelector((state) => state.auth);

    // ✅ Automatically calculate unread count from notifications
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `receiver_id=eq.${user.profileId}`,
                },
                (payload: any) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `receiver_id=eq.${user.profileId}`,
                },
                (payload: any) => {
                    const updated = payload.new as Notification;
                    setNotifications((prev) =>
                        prev.map((n) => (n.id === updated.id ? updated : n))
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `receiver_id=eq.${user.profileId}`,
                },
                (payload: any) => {
                    const deleted = payload.old as Notification;
                    setNotifications((prev) =>
                        prev.filter((n) => n.id !== deleted.id)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        const data = await getNotifications(user.profileId!);
        if (data) {
            setNotifications(data);
        }
    };

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
        // Re-fetch is optional, but ensures latest state consistency
        await fetchNotifications();
    };

    const handleDelete = async (id: string) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== id));
            await deleteNotification(id);
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    }

    return {
        notifications,
        unreadCount,
        markAsRead,
        handleDelete,
        refetch: fetchNotifications,
    };
}