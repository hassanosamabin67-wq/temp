export const LogTemplates = {
    USER_CREATED: (userId: string, adminName?: string) => ({
        action: 'User Account Created',
        target: userId,
        details: 'New user account has been created',
        action_type: 'user' as const,
        severity: 'success' as const,
        admin_name: adminName
    }),

    USER_DEACTIVATED: (action: boolean, target: string) => ({
        action: `${action ? "User Profile Deactivation" : "User Profile Activation"}`,
        target: target,
        details: `${action ? "User account has been deactivated by admin" : "User account has been activated by admin"}`,
        action_type: 'user' as const,
        severity: 'warning' as const
    }),

    USER_LOGIN: (userId: string) => ({
        action: 'User Login',
        target: userId,
        details: 'User successfully logged in',
        action_type: 'auth' as const,
        severity: 'info' as const
    }),

    USER_LOGOUT: (userId: string) => ({
        action: 'User Logout',
        target: userId,
        details: 'User logged out',
        action_type: 'auth' as const,
        severity: 'info' as const
    }),

    STRIPE_RESET: (target: string) => ({
        action: 'Stripe onboarding reset',
        target: target,
        details: 'User Stripe Account Reset',
        action_type: 'user' as const,
        severity: 'info' as const
    }),

    // Room Actions
    ROOM_CREATED: (roomId: string, adminName: string, adminId: string, roomName: string) => ({
        action: 'Room Created',
        target: roomId,
        details: `Room "${roomName}" created by user ${adminId}`,
        action_type: 'room' as const,
        severity: 'success' as const,
        admin_id: adminId,
        admin_name: adminName
    }),

    ROOM_DELETED: (roomId: string, adminName: string, adminId: string, roomName?: string) => ({
        action: 'Room Deleted',
        target: roomId,
        details: `Room ${roomName ? `"${roomName}"` : ''} has been deleted`,
        action_type: 'room' as const,
        severity: 'warning' as const,
        admin_id: adminId,
        admin_name: adminName
    }),

    ROOM_MEMBER_ADDED: (roomId: string, userId: string, roomName?: string) => ({
        action: 'Room Member Added',
        target: roomId,
        details: `User ${userId} joined room ${roomName ? `"${roomName}"` : ''}`,
        action_type: 'room' as const,
        severity: 'info' as const
    }),

    ROOM_MEMBER_REMOVED: (roomId: string, userId: string, adminName?: string) => ({
        action: 'Room Member Removed',
        target: roomId,
        details: `User ${userId} removed from room`,
        action_type: 'room' as const,
        severity: 'warning' as const,
        admin_name: adminName || 'System'
    }),

    // Content Actions
    CONTENT_FLAGGED: (action: boolean, contentId: string, contentType: string, adminName: string, adminId: string, reason?: string, actionType?: string) => ({
        action: `${action ? 'Content Unflagged' : "Content Flagged"}`,
        target: contentId,
        details: `${contentType} ${action ? "Unflagged" : "flagged"}${reason ? ` for: ${reason}` : ' by Admin'}`,
        action_type: `${actionType ? actionType : "content"}` as const,
        severity: 'warning' as const,
        status: "pending",
        admin_name: adminName,
        admin_id: adminId
    }),

    CONTENT_REMOVED: (contentId: string, contentType: string, adminName: string, adminId: string) => ({
        action: 'Content Removed',
        target: contentId,
        details: `${contentType} removed by moderator`,
        action_type: 'content' as const,
        severity: 'warning' as const,
        admin_id: adminId,
        admin_name: adminName
    }),

    CONTENT_DISABLED: (action: boolean, contentId: string, contentType: string, adminName: string, adminId: string, reason?: string) => ({
        action: `${action ? 'Content Enabled' : "Content Disabled"}`,
        target: contentId,
        details: `${contentType} ${action ? 'enabled' : "disabled"}${reason ? ` for: ${reason}` : ' by Admin'}`,
        action_type: 'content' as const,
        severity: 'warning' as const,
        admin_name: adminName,
        admin_id: adminId
    }),

    // System Actions
    SYSTEM_MAINTENANCE: (details: string) => ({
        action: 'System Maintenance',
        target: 'system',
        details: details,
        action_type: 'system' as const,
        severity: 'info' as const
    }),

    SYSTEM_ERROR: (error: string, target?: string) => ({
        action: 'System Error',
        target: target || 'system',
        details: error,
        action_type: 'system' as const,
        severity: 'error' as const
    }),

    // Admin Dashboard Visionary Applications
    APPLICATION_AC_Re: (action: string, target: string) => ({
        action: "Visionary Application",
        target: target,
        details: `Visionary Application ${action}ed`,
        action_type: 'applcation' as const,
        severity: 'success' as const
    }),

    PROFILE_NOTE: (target: string) => ({
        action: "Profile Note",
        target: target,
        details: 'Profile Note Added on Visionary Profile',
        action_type: 'profile_note' as const,
        severity: 'success' as const
    })
};