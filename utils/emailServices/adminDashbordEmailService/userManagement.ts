import { userManagementEmail } from "./type";

export async function sendAccountActivationEmail(params: userManagementEmail) {
    const response = await fetch('/api/admin-email/user-management/account-activation', {
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

export async function sendAccountDeactivationEmail(params: userManagementEmail) {
    const response = await fetch('/api/admin-email/user-management/account-deactivation', {
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

export async function sendAccountReactivationEmail(params: userManagementEmail) {
    const response = await fetch('/api/admin-email/user-management/account-reactivate', {
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