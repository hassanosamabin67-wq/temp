export interface CreateNotificationParams {
    userId: string
    receiverId: string
    type: string
    title: string
    message?: string
    data?: any
    actionUrl?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    expiresAt?: string
}

export interface NotificationPreferences {
    messages: boolean;
    projectUpdates: boolean;
    paymentUpdates: boolean;
    collabRoom: boolean;
}