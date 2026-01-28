import { SendVisionaryEmailParams } from "./type";

export async function sendVisionaryAcceptEmail(params: SendVisionaryEmailParams) {
    const response = await fetch('/api/admin-email/visionary-application/accept', {
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


export async function sendVisionaryRejectEmail(params: SendVisionaryEmailParams) {
    const response = await fetch('/api/admin-email/visionary-application/reject', {
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