import { supabase } from "@/config/supabase"
import { CreateNotificationParams, NotificationPreferences } from "@/types/collabRoomNotification"
import { offerMessageType, sendContractEmail } from "@/utils/emailServices/emailServices"

export async function createNotification(params: CreateNotificationParams) {
    const preferences = await getUserNotificationPreferences(params.receiverId)

    const typeMapping: { [key: string]: keyof NotificationPreferences } = {
        'message': 'messages',
        'offer': 'projectUpdates',
        'collab room': 'collabRoom',
        'invitation accepted': 'projectUpdates',
        'payment': 'paymentUpdates',
        'milestone': 'projectUpdates'
    }

    const preferenceKey = typeMapping[params.type]
    if (preferenceKey && !preferences[preferenceKey]) {
        return null
    }

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            sender_id: params.userId,
            receiver_id: params.receiverId,
            type: params.type,
            title: params.title,
            message: params.message,
            data: params.data,
            action_url: params.actionUrl,
            priority: params.priority || 'normal',
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// Notification preferences management
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error && error.code === 'PGRST116') {
        return await createDefaultNotificationPreferences(userId)
    }

    if (error) throw error

    return {
        messages: data.messages ?? true,
        projectUpdates: data.project_updates ?? true,
        paymentUpdates: data.payment_updates ?? true,
        collabRoom: data.collab_room ?? true
    }
}

export async function createDefaultNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences = {
        messages: true,
        project_updates: true,
        payment_updates: true,
        collab_room: true
    }

    const { data, error } = await supabase
        .from('user_notification_preferences')
        .insert({
            user_id: userId,
            ...defaultPreferences
        })
        .select()
        .single()

    if (error) throw error

    return {
        messages: data.messages,
        projectUpdates: data.project_updates,
        paymentUpdates: data.payment_updates,
        collabRoom: data.collab_room ?? true
    }
}

export async function updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const dbPreferences: any = {}

    if (preferences.messages !== undefined) dbPreferences.messages = preferences.messages
    if (preferences.projectUpdates !== undefined) dbPreferences.project_updates = preferences.projectUpdates
    if (preferences.paymentUpdates !== undefined) dbPreferences.payment_updates = preferences.paymentUpdates
    if (preferences.collabRoom !== undefined) dbPreferences.collab_room = preferences.collabRoom

    const { data, error } = await supabase
        .from('user_notification_preferences')
        .update(dbPreferences)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) throw error

    return {
        messages: data.messages,
        projectUpdates: data.project_updates,
        paymentUpdates: data.payment_updates,
        collabRoom: data.collab_room ?? true
    }
}

// Specific notification creators
export async function createMessageNotification(userId: string, senderName: string, receiverId: string, messagePreview: string, conversationId: string) {
    const preferences = await getUserNotificationPreferences(receiverId)
    if (preferences.messages) {
        return createNotification({
            userId,
            receiverId,
            type: 'message',
            title: `New message from ${senderName}`,
            message: messagePreview,
            data: { conversationId, senderName },
            actionUrl: `/messages/room/${conversationId}?ch=${userId}`,
            priority: 'normal'
        })
    }
}

export async function createOfferMessageNotificationWithEmail(userId: string, senderName: string, receiverId: string, messagePreview: string, receiverEmail: string, contractTitle: string, contractId: string, messageType: offerMessageType, title: string, conversationId: string) {
    const preferences = await getUserNotificationPreferences(receiverId);
    if (preferences.projectUpdates || preferences.paymentUpdates) {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'offer',
            title: `${title} ${senderName}`,
            message: messagePreview,
            data: { senderName },
            actionUrl: `/messages/room/${conversationId}`,
            priority: 'normal'
        })

        await sendContractEmail({
            receiverEmail,
            senderName,
            contractTitle,
            contractId,
            contractUrl: `/messages`,
            messageType
        })
        return notification
    }
}

export async function createOfferMessageNotification(userId: string, senderName: string, receiverId: string, messagePreview: string, title: string, conversationId: string) {
    const preferences = await getUserNotificationPreferences(receiverId);
    if (preferences.projectUpdates) {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'offer',
            title: `${senderName} has submitted the work for ${title}`,
            message: messagePreview,
            data: { senderName },
            actionUrl: `/messages/room/${conversationId}`,
            priority: 'normal'
        })
        return notification
    }
}

// Additional utility functions
export async function markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

    if (error) throw error
}

export async function markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

    if (error) throw error
}

export async function deleteNotification(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

    if (error) throw error
}

export async function getNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error
    return data
}