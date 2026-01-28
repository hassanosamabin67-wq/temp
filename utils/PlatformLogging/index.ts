import { supabase } from '@/config/supabase';
import { LogTemplates } from './logTemplate';

export interface LogEntry {
    action: string;
    target: string;
    details: string;
    action_type: 'user' | 'room' | 'content' | 'auth' | 'system' | 'applcation' | 'profile_note' | any;
    severity: 'info' | 'warning' | 'error' | 'success';
    admin_id?: string;
    admin_name?: string;
}

export const logActivity = async (logData: LogEntry) => {
    try {
        const { error } = await supabase
            .from('platform_logs')
            .insert({
                ...logData,
            });

        if (error) {
            console.error('Error inserting system log:', error);
            return
        }
    } catch (err) {
        console.error('Unexpected error logging activity:', err);
    }
};

export const logUserAction = {
    onSignup: (userId: string) =>
        logActivity(LogTemplates.USER_CREATED(userId)),

    onLogin: (userId: string) =>
        logActivity(LogTemplates.USER_LOGIN(userId)),

    onActivateDeactivate: (action: boolean, target: string) =>
        logActivity(LogTemplates.USER_DEACTIVATED(action, target)),

    onStripeReset: (target: string) =>
        logActivity(LogTemplates.STRIPE_RESET(target))
};

export const logRoomAction = {
    onCreate: (roomId: string, adminName: string, adminId: string, roomName: string) =>
        logActivity(LogTemplates.ROOM_CREATED(roomId, adminName, adminId, roomName)),

    onDelete: (roomId: string, adminName: string, adminId: string, roomName?: string) =>
        logActivity(LogTemplates.ROOM_DELETED(roomId, adminName, adminId, roomName)),

    onMemberJoin: (roomId: string, userId: string, roomName?: string) =>
        logActivity(LogTemplates.ROOM_MEMBER_ADDED(roomId, userId, roomName)),

    onMemberRemove: (roomId: string, userId: string, adminName?: string) =>
        logActivity(LogTemplates.ROOM_MEMBER_REMOVED(roomId, userId, adminName))
};

export const logContentAction = {
    onFlag: (action: boolean, contentId: string, contentType: string, adminName: string, adminId: string, reason?: string, actionType?: string) => logActivity(LogTemplates.CONTENT_FLAGGED(action, contentId, contentType, adminName, adminId, reason, actionType)),
    onRemove: (contentId: string, contentType: string, adminName: string, adminId: string) => logActivity(LogTemplates.CONTENT_REMOVED(contentId, contentType, adminName, adminId)),
    onDisabled: (action: boolean, contentId: string, contentType: string, adminName: string, adminId: string, reason?: string) => logActivity(LogTemplates.CONTENT_DISABLED(action, contentId, contentType, adminName, adminId, reason)),
};

export const visionaryApplication = {
    onAcceptReject: (action: string, target: string) => logActivity(LogTemplates.APPLICATION_AC_Re(action, target)),
    onNoteAdd: (target: string) => logActivity(LogTemplates.PROFILE_NOTE(target))
}