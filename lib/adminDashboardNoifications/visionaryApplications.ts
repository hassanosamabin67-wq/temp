import { sendVisionaryAcceptEmail, sendVisionaryRejectEmail } from "@/utils/emailServices/adminDashbordEmailService/visionaryApplications";
import { createNotification } from "../notificationService";

export async function visionaryAcceptApplicationNotification(userId: string, receiverId: string, actionUrl: string, receiverEmail: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'visionary application',
            title: `Your Application has been accepted`,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendVisionaryAcceptEmail({ receiverEmail, actionUrl });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function visionaryRejectApplicationNotification(userId: string, receiverId: string, actionUrl: string, receiverEmail: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'visionary application',
            title: `Your Application has Rejeted`,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendVisionaryRejectEmail({ receiverEmail });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}