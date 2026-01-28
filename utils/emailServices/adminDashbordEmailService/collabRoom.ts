import { DisabledRoomEmailData, EnabledRoomEmailData, FlaggedRoomEmailData, UnflaggedRoomEmailData } from "./type";

export async function sendRoomFlagEmail(params: FlaggedRoomEmailData) {
    const response = await fetch('/api/admin-email/collab-room/flag', {
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

export async function sendRoomUnflagEmail(params: UnflaggedRoomEmailData) {
    const response = await fetch('/api/admin-email/collab-room/unflag', {
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

export async function sendRoomDisableEmail(params: DisabledRoomEmailData) {
    const response = await fetch('/api/admin-email/collab-room/disable', {
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

export async function sendRoomEnableEmail(params: EnabledRoomEmailData) {
    const response = await fetch('/api/admin-email/collab-room/enable', {
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