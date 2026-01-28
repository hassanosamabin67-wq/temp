interface VIDEO_CALL_CONTROLS {
    micOn?: boolean;
    setMic?: (value: boolean | ((prev: boolean) => boolean)) => void;
    cameraOn?: boolean;
    setCamera?: (value: boolean | ((prev: boolean) => boolean)) => void;
    screenSharing?: boolean;
    toggleScreenShare?: (user: { userId: string, name: string }) => void;
    calling?: boolean;
    handleEndCall?: () => void;
    setCalling?: (value: boolean | ((prev: boolean) => boolean)) => void;
    showWhiteBoard?: boolean;
    setShowWhiteBoard?: (value: boolean | ((prev: boolean) => boolean)) => void;
    currentLiveStatus?: "live" | "lock" | "end";
    handleLockRoom?: () => void;
    showWhiteboardButton?: boolean;
    showLockButton?: boolean;
    channelID?: string;
    duration?: number | string;
}

interface JoinChannelResult {
    rtcToken: string | null;
    currentLiveStatus: "live" | "lock" | "end" | null;
    calling: boolean;
    setCalling: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentLiveStatus: (p: string) => void
}