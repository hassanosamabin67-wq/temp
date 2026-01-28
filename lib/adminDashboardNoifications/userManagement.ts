import { sendAccountActivationEmail, sendAccountDeactivationEmail } from "@/utils/emailServices/adminDashbordEmailService/userManagement";
import { createNotification } from "../notificationService";

export async function accountActivationNotification(userId: string, receiverId: string, actionUrl: string, receiverEmail: string, receiverName: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'User Profile',
            title: `Your Kaboom Collab Account is Now Active`,
            message: "You can now log in and start collaborating.",
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendAccountActivationEmail({ receiverEmail, firstName: receiverName });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function accountDectivationNotification(userId: string, receiverId: string, actionUrl: string, receiverEmail: string, receiverName: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'User Profile',
            title: `Your Kaboom Collab Account Has Been Deactivated`,
            message: "This may be due to inactivity, a policy issue, or a request from your end.",
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })
        await sendAccountDeactivationEmail({ receiverEmail, firstName: receiverName });

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}

export async function accountResetStripeNotification(userId: string, receiverId: string, actionUrl: string) {
    try {
        const notification = await createNotification({
            userId,
            receiverId,
            type: 'User Profile',
            title: 'Stripe Connection Reset',
            message: `The Stripe account connected to your Kaboom Collab profile has been reset. Please log in to reconnect your Stripe account.`,
            data: { actionUrl },
            actionUrl: actionUrl,
            priority: 'high'
        })

        return notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
}