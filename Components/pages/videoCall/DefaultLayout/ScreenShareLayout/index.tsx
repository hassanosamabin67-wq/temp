import { FC, useMemo } from "react";
import styles from "./styles.module.css";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import Image from "next/image";
import { generateRandomColor } from "@/lib/generateRandomColor";
import useActiveSpeakers from "@/hooks/useActiveSpeakers";

interface ScreenShareLayoutInterface {
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
    screenSharingUser: number | null;
}

const ScreenShareLayout: FC<ScreenShareLayoutInterface> = ({
    remoteUsers,
    localMicrophoneTrack,
    localCameraTrack,
    cameraOn,
    micOn,
    profile,
    userImage,
    participants,
    screenSharingUser,
}) => {
    const userColors = useMemo(() => {
        const colorMap: { [key: string]: string } = {};

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

    // Find the screen sharing user
    const shareUser = Array.isArray(remoteUsers)
        ? remoteUsers.find((u: any) => u?.uid === screenSharingUser)
        : null;

    // Get remaining remote users (excluding the screen sharer)
    const remainingRemoteUsers = shareUser
        ? remoteUsers.filter((u) => u?.uid !== screenSharingUser)
        : remoteUsers;

    return (
        <div className={styles.screenShareLayout}>
            {/* Main Stage - Screen Share */}
            <div
                className={`${styles.mainStageContainer} ${shareUser && isSpeaking(shareUser.uid) ? styles.speakingBorder : ""}`}
            >
                {shareUser ? (
                    <RemoteUser
                        user={shareUser}
                        style={{
                            background: userColors[shareUser.uid || "remote"],
                            border: "4px solid white",
                            borderRadius: "10px",
                            width: "100%",
                            height: "100%",
                        }}
                    />
                ) : (
                    // Fallback to local user if no screen sharer found
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
                )}
            </div>

            {/* Bottom Users - Local + Remote Users */}
            <div className={styles.bottomUsersContainer}>
                {/* Local User Tile */}
                <div
                    className={`${styles.userCard} ${isSpeaking(profile.profileId || "local") ? styles.speakingBorder : ""}`}
                >
                    <LocalUser
                        audioTrack={localMicrophoneTrack}
                        cameraOn={cameraOn}
                        micOn={micOn}
                        playAudio={false}
                        videoTrack={localCameraTrack}
                        style={{
                            background: userColors[profile.profileId || "local"],
                            border: "3px solid white",
                            borderRadius: "8px",
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        {!cameraOn && (
                            <div className={styles.cardUserDetails}>
                                <Image
                                    style={{ borderRadius: "100%", width: 32, height: 32 }}
                                    src={profile.profileImage || userImage}
                                    alt={"userimg"}
                                    width={100}
                                    height={100}
                                />
                                <span style={{ color: "#fff", fontSize: "12px" }}>
                                    {profile.firstName ? `${profile.firstName} (You)` : "You"}
                                </span>
                            </div>
                        )}
                    </LocalUser>
                </div>

                {/* Remote Users */}
                {remainingRemoteUsers.map((user) => {
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
                            className={`${styles.userCard} ${isSpeaking(uid) ? styles.speakingBorder : ""}`}
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
                                    <div className={styles.cardUserDetails}>
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
                                    <div className={styles.cardUserDetails}>
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
        </div>
    );
};

export default ScreenShareLayout;