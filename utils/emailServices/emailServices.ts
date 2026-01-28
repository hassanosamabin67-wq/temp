interface SendInvitationEmailParams {
    receiverEmail: string;
    senderName: string;
    roomId: string;
    actionUrl: string;
}

interface SendAcceptedInvitationEmailParams {
    receiverEmail: string;
    senderName: string;
    thinkTankTitle?: string;
}

interface SendWelcomeEmailParams {
    receiverEmail: string;
    firstName: string;
    verificationUrl?: string;
    profileType: "client" | "visionary";
}

export type offerMessageType = 'offer-received' | 'offer-accepted' | 'offer-declined' | "work-approved" | 'project-completed';

interface SendContractEmailParams {
    receiverEmail: string;
    senderName: string;
    contractTitle: string;
    contractId: string;
    contractUrl: string;
    messageType: offerMessageType
}

export async function sendInvitationEmail(params: SendInvitationEmailParams) {
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitation/${params.actionUrl}`;

    const response = await fetch('/api/send-invitation-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...params,
            invitationUrl,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
    }

    return response.json();
}

export async function sendAcceptedInvitationEmail(params: SendAcceptedInvitationEmailParams) {
    const response = await fetch('/api/send-invitation-accepted-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send acceptance email');
    }

    return response.json();
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
    const response = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send welcome email');
    }

    return response.json();
}

export async function sendContractEmail(params: SendContractEmailParams) {
    const response = await fetch('/api/contract-email/send-contract-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send welcome email');
    }

    return response.json();
}