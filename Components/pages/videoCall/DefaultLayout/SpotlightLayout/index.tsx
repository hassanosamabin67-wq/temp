import { FC, useMemo } from "react";
import styles from "./styles.module.css";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import Image from "next/image";
import { generateRandomColor } from "@/lib/generateRandomColor";
import useActiveSpeakers from "@/hooks/useActiveSpeakers";

interface SpotlightLayoutInterface {
    remoteUsers: any[];
    localMicrophoneTrack: any;
    localCameraTrack: any;
    cameraOn: boolean;
    micOn: boolean;
    profile: {
        profileImage?: string;
        profileId?: string | null;
        firstName?: string;
    };
    userImage: string;
    participants: any[] | null;
}

const SpotlightLayout: FC<SpotlightLayoutInterface> = ({
    remoteUsers,
    localMicrophoneTrack,
    localCameraTrack,
    cameraOn,
    micOn,
    profile,
    userImage,
    participants,
}) => {
    const userColors = useMemo(() => {
        const colorMap: { [key: string]: string } = {};

        // Assign random colors to each user (local and remote)
        const allUsers = [profile, ...(participants || []), ...remoteUsers];
        allUsers.forEach((user) => {
            const userId = user.profileId || user.uid;
            if (!colorMap[userId]) {
                colorMap[userId] = generateRandomColor();
            }
        });

        return colorMap;
    }, [remoteUsers, profile, participants]);

    const activeSpeakers = useActiveSpeakers(200);

    const isSpeaking = (uid?: string | number) => {
        if (uid === undefined || uid === null) return false;
        return activeSpeakers.some((s) => String(s) === String(uid));
    };

    return (
        <div className={styles.spotlightLayout}>
            {/* Local User - Big Layout */}
            <div
                className={`${styles.localUserContainer} ${isSpeaking(profile.profileId || "local") ? styles.speakingBorder : ""}`}
            >
                <LocalUser
                    audioTrack={localMicrophoneTrack}
                    cameraOn={cameraOn}
                    micOn={micOn}
                    playAudio={false}
                    videoTrack={localCameraTrack}
                    style={{
                        background: userColors[profile.profileId || "local"],
                        border: "4px solid white",
                        borderRadius: "10px",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {!cameraOn && (
                        <div className={styles.userDetails}>
                            <Image
                                style={{ borderRadius: "100%", width: 60, height: 60 }}
                                src={profile.profileImage || userImage}
                                alt={"userimg"}
                                width={100}
                                height={100}
                            />
                            {!profile.profileId ? (
                                <span style={{ color: "#fff" }}>Anonymous mode</span>
                            ) : (
                                <span style={{ color: "#fff" }}>
                                    {profile.firstName + " (You)"}
                                </span>
                            )}
                        </div>
                    )}
                </LocalUser>
            </div>

            {/* Remote Users - Bottom Scrollable */}
            {remoteUsers.length > 0 && (
                <div className={styles.remoteUsersContainer}>
                    {remoteUsers.map((user) => {
                        const matchedParticipants = participants?.find(
                            (p: any) => p.agora_uid === user.uid
                        );
                        const isCameraOn = user.videoTrack && user.videoTrack.isPlaying;
                        const isUserHost =
                            matchedParticipants && matchedParticipants.role === "host";
                        const userName = matchedParticipants
                            ? matchedParticipants.name
                            : "Anonymous";
                        const userImageSrc = matchedParticipants
                            ? matchedParticipants.picture || userImage
                            : userImage;
                        const userColor = userColors[user.profileId || user.uid];
                        const uid = user.uid;
                        return (
                            <div
                                key={user.uid}
                                className={`${styles.remoteUserCard} ${isSpeaking(uid) ? styles.speakingBorder : ""}`}
                            >
                                <RemoteUser
                                    user={user}
                                    style={{
                                        background: userColor,
                                        border: "3px solid white",
                                        borderRadius: "8px",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    {isCameraOn ? null : matchedParticipants ? (
                                        <div
                                            className={styles.remoteUserDetails}
                                            key={matchedParticipants?.agora_uid}
                                        >
                                            <Image
                                                style={{ borderRadius: "100%", width: 32, height: 32 }}
                                                src={userImageSrc}
                                                alt={userName}
                                                width={100}
                                                height={100}
                                            />
                                            <span style={{ color: "#fff", fontSize: "12px" }}>
                                                {userName} {isUserHost && "(Host)"}
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            className={styles.remoteUserDetails}
                                            key={matchedParticipants?.agora_uid}
                                        >
                                            <Image
                                                style={{ borderRadius: "100%", width: 32, height: 32 }}
                                                src={userImage}
                                                alt={userName}
                                                width={100}
                                                height={100}
                                            />
                                            <span style={{ color: "#fff", fontSize: "12px" }}>
                                                Anonymous
                                            </span>
                                        </div>
                                    )}
                                </RemoteUser>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SpotlightLayout;