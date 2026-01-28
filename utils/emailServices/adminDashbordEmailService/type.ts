export interface SendVisionaryEmailParams {
    receiverEmail: string;
    actionUrl?: string;
}

export interface userManagementEmail {
    receiverEmail: string;
    firstName: string;
}

export interface FlaggedRoomEmailData {
    receiverEmail: string;
    roomName: string;
    reason: string;
}

export interface DisabledRoomEmailData {
    receiverEmail: string;
    roomName: string;
    disabledReason: string;
}

export interface UnflaggedRoomEmailData {
    roomName: string;
    receiverEmail: string;
}

export interface EnabledRoomEmailData {
    roomName: string;
    receiverEmail: string;
}

export interface CollabCardInvitationEmailParams {
    receiverEmail: string;
    firstName: string;
    lastName: string;
    earnings?: number;
    actionUrl?: string;
}