import { CollabCardInvitationEmailParams } from "./type";

export async function sendCollabCardInvitationEmail(params: CollabCardInvitationEmailParams) {
    const response = await fetch('/api/admin-email/collab-card/invitation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        return error.message || 'Failed to send email';
    }

    return response.json();
}