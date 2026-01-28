import { createNotification, getUserNotificationPreferences } from "./notificationService";
import { sendAcceptedInvitationEmail, sendInvitationEmail } from "@/utils/emailServices/emailServices"

// Room Invitation

export async function createCollabRoomInviteNotificationWithEmail(userId: string, senderName: string, receiverId: string, actionUrl: string, receiverEmail: string, roomId: string) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            const notification = await createNotification({
                userId,
                receiverId,
                type: 'collab room',
                title: `${senderName} has invited you to join collab room`,
                data: { actionUrl, senderName },
                actionUrl: `/invitation/${actionUrl}`,
                priority: 'normal'
            })
            await sendInvitationEmail({
                receiverEmail,
                senderName,
                roomId,
                actionUrl
            });

            return notification;
        }
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function collabRoomAcceptedNotificationWithEmail(senderId: string, senderName: string, receiverId: string, receiverEmail: string, thinkTankTitle?: string) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            const notification = await createNotification({
                userId: senderId,
                receiverId,
                type: 'collab room',
                title: `${senderName} has accepted your invitation`,
                priority: 'normal',
            });

            await sendAcceptedInvitationEmail({
                receiverEmail,
                senderName,
                thinkTankTitle,
            });

            return notification;
        }
    } catch (error) {
        console.error('Error sending acceptance email/notification:', error);
        throw error;
    }
}

export async function collabRoomJoining(senderId: string, senderName: string, receiverId: string, thinkTankTitle?: string, isSubscriptionBase?: boolean) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            if (isSubscriptionBase) {
                const notification = await createNotification({
                    userId: senderId,
                    receiverId,
                    type: 'collab room',
                    title: `${senderName} has subscribed to your collab room ${thinkTankTitle}`,
                    priority: 'normal',
                });
                return notification;
            }
            const notification = await createNotification({
                userId: senderId,
                receiverId,
                type: 'collab room',
                title: `${senderName} has joined your collab room ${thinkTankTitle}`,
                priority: 'normal',
            });

            return notification;
        }
    } catch (error) {
        console.error('Error sending joining notification:', error);
        throw error;
    }
}

export async function collabRoomJoinRequest(senderId: string, senderName: string, receiverId: string, thinkTankTitle?: string) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            const notification = await createNotification({
                userId: senderId,
                receiverId,
                type: 'collab room',
                title: `${senderName} has requested to join your collab room ${thinkTankTitle}`,
                priority: 'normal',
            });

            return notification;
        }
    } catch (error) {
        console.error('Error sending joining notification:', error);
        throw error;
    }
}

export async function collabRoomRequestAccept(senderId: string, receiverId: string, thinkTankTitle?: string) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            const notification = await createNotification({
                userId: senderId,
                receiverId,
                type: 'collab room',
                title: `Your request to join ${thinkTankTitle} has been accepted!`,
                priority: 'normal',
            });

            return notification;
        }
    } catch (error) {
        console.error('Error sending joining notification:', error);
        throw error;
    }
}

// EVENT UPDATES

export async function collabRoomEventStartUpdate(senderId: string, receiverId: string, eventName: string, thinkTankId: string) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            const notification = await createNotification({
                userId: senderId,
                receiverId,
                type: 'collab room',
                title: `Event: ${eventName} has been started`,
                message: `${eventName} has been started, if you not joined yet then hurry up!`,
                actionUrl: `/think-tank/room/${thinkTankId}`,
                priority: 'high',
            });

            return notification;
        }
    } catch (error) {
        console.error('Error sending event start notification:', error);
        throw error;
    }
}

export async function collabRoomNextEventUpdate(senderId: string, receiverId: string, roomName: string, thinkTankId: string, sessionDate: string) {
    try {
        const preferences = await getUserNotificationPreferences(receiverId);
        if (preferences.collabRoom) {
            const notification = await createNotification({
                userId: senderId,
                receiverId,
                type: 'collab room',
                title: `Next session scheduled`,
                message: `Collab Room: ${roomName} next session scheduled for: ${sessionDate}. Save the date to not miss it!`,
                actionUrl: `/think-tank/room/${thinkTankId}`,
                priority: 'high',
            });

            return notification;
        }
    } catch (error) {
        console.error('Error sending event start notification:', error);
        throw error;
    }
}