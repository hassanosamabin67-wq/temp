import { useNotification } from '@/Components/custom/custom-notification';
import { getUserNotificationPreferences, updateNotificationPreferences } from '@/lib/notificationService';
import { NotificationPreferences } from '@/types/collabRoomNotification';
import { useState, useEffect, useCallback } from 'react';

export const useNotificationPreferences = (userId: string | undefined) => {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        messages: true,
        projectUpdates: true,
        paymentUpdates: true,
        collabRoom: true
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const { notify } = useNotification()

    const loadPreferences = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const prefs = await getUserNotificationPreferences(userId);
            setPreferences({
                messages: prefs.messages,
                projectUpdates: prefs.projectUpdates,
                paymentUpdates: prefs.paymentUpdates,
                collabRoom: prefs.collabRoom
            });
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    const togglePreference = useCallback(async (key: keyof NotificationPreferences, value?: boolean) => {
        if (!userId) return;

        const newValue = value !== undefined ? value : !preferences[key];
        const preferenceLabel = {
            messages: 'Message notifications',
            projectUpdates: 'Project update notifications',
            paymentUpdates: 'Payment notifications',
            collabRoom: 'Collab Room notifications'
        }[key];

        try {
            setUpdating(key);

            setPreferences(prev => ({ ...prev, [key]: newValue }));

            await updateNotificationPreferences(userId, { [key]: newValue });
            notify({ type: "success", message: `${preferenceLabel} ${newValue ? 'enabled' : 'disabled'}` })

        } catch (error) {
            console.error('Error updating preference:', error);
            setPreferences(prev => ({ ...prev, [key]: !newValue }));
        } finally {
            setUpdating(null);
        }
    }, [userId, preferences]);

    const updateBulkPreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
        if (!userId) return;

        try {
            setUpdating('bulk');
            setPreferences(prev => ({ ...prev, ...updates }));

            await updateNotificationPreferences(userId, updates);
            notify({ type: "success", message: 'Notification preferences updated' })

        } catch (error) {
            console.error('Error updating preferences:', error);

            await loadPreferences();
        } finally {
            setUpdating(null);
        }
    }, [userId, loadPreferences]);

    return {
        preferences,
        loading,
        updating,
        togglePreference,
        updateBulkPreferences,
        refetch: loadPreferences
    };
};