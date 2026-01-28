import { sendRoomDisableEmail, sendRoomEnableEmail, sendRoomFlagEmail, sendRoomUnflagEmail } from "@/utils/emailServices/adminDashbordEmailService/collabRoom";
import { createNotification } from "../notificationService";

export async function roomFlagNotification(userId: string, receiverId: string, message: string, actionUrl: string, receiverEmail: string, roomName: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'collab room',
            title: `Your Collab Room (${roomName}) has been flagged`,
            message: message,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendRoomFlagEmail({ reason: message, receiverEmail, roomName });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function roomUnFlagNotification(userId: string, receiverId: string, message: string, actionUrl: string, receiverEmail: string, roomName: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'collab room',
            title: `Your Collab Room (${roomName}) has been unflagged`,
            message: message,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendRoomUnflagEmail({ roomName, receiverEmail })

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function roomDisableNotification(userId: string, receiverId: string, message: string, actionUrl: string, receiverEmail: string, roomName: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'collab room',
            title: `Your Collab Room (${roomName}) has been disabled`,
            message: message,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendRoomDisableEmail({ receiverEmail, roomName, disabledReason: message });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function roomEnableNotification(userId: string, receiverId: string, message: string, actionUrl: string, receiverEmail: string, roomName: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'collab room',
            title: `Your Collab Room (${roomName}) has been enabled`,
            message: message,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendRoomEnableEmail({ receiverEmail, roomName });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}