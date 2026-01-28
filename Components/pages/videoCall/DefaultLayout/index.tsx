import { FC, useMemo, useState, useEffect } from "react";
import styles from "./style.module.css";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import Image from "next/image";
import { generateRandomColor } from "@/lib/generateRandomColor";
import useActiveSpeakers from "@/hooks/useActiveSpeakers";
import SpotlightLayout from "./SpotlightLayout";

interface DefaultLayoutInterface {
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

const DefaultLayout: FC<DefaultLayoutInterface> = ({
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
        colorMap[userId] = generateRandomColor(); // Generate once per user
      }
    });

    return colorMap;
  }, [remoteUsers, profile, participants]);
  const totalParticipants = 1 + remoteUsers.length;
  const unit = "minmax(0, 1fr) ";

  const gridTemplateColumns =
    totalParticipants === 2
      ? "repeat(2, 1fr)"
      : totalParticipants === 3
        ? "repeat(3, 1fr)"
        : totalParticipants > 3
          ? unit.repeat(Math.min(totalParticipants, 2)).trim()
          : totalParticipants > 4
            ? unit.repeat(Math.min(totalParticipants, 3)).trim()
            : totalParticipants > 9
              ? unit.repeat(Math.min(totalParticipants, 4)).trim()
              : unit;

  const activeSpeakers = useActiveSpeakers(200);

  const isSpeaking = (uid?: string | number) => {
    if (uid === undefined || uid === null) return false;
    return activeSpeakers.some((s) => String(s) === String(uid));
  };

  // Detect mobile view based on screen width
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth <= 1024);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Use SpotlightLayout for mobile screens OR when there are more than 4 participants
  const useSpotlightLayout = isMobileView || totalParticipants > 4;

  if (useSpotlightLayout) {
    return (
      <SpotlightLayout
        cameraOn={cameraOn}
        localCameraTrack={localCameraTrack}
        localMicrophoneTrack={localMicrophoneTrack}
        micOn={micOn}
        participants={participants}
        profile={profile}
        remoteUsers={remoteUsers}
        userImage={userImage}
      />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: gridTemplateColumns,
        gap: 10,
        padding: "10px 30px",
        height: "80%",
        maxWidth: "1300px",
        margin: "0 auto",
      }}
      className={styles.videoCallContainer}
    >
      <div className={`${styles.callDiv} ${isSpeaking(profile.profileId || "local") ? styles.speakingBorder : ""}`}>
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
          }}
        >
          {!cameraOn && (
            <div className={styles.userDetails}>
              <Image
                style={{ borderRadius: "100%", width: 40, height: 40 }}
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
          <div key={user.uid} className={`${styles.callDiv} ${isSpeaking(uid) ? styles.speakingBorder : ""}`}>
            <RemoteUser
              user={user}
              style={{
                background: userColor,
                border: "4px solid white",
                borderRadius: "10px",
              }}
            >
              {isCameraOn
                ? null
                : matchedParticipants ? (
                  <div
                    className={styles.userDetails}
                    key={matchedParticipants?.agora_uid}
                  >
                    <Image
                      style={{ borderRadius: "100%", width: 40, height: 40 }}
                      src={userImageSrc}
                      alt={userName}
                      width={100}
                      height={100}
                    />
                    <span style={{ color: "#fff" }}>
                      {userName} {isUserHost && "(Host)"}
                    </span>
                  </div>
                ) : (
                  <div
                    className={styles.userDetails}
                    key={matchedParticipants?.agora_uid}
                  >
                    <Image
                      style={{ borderRadius: "100%", width: 40, height: 40 }}
                      src={userImage}
                      alt={userName}
                      width={100}
                      height={100}
                    />
                    <span style={{ color: "#fff" }}>
                      Anonymous
                    </span>
                  </div>
                )}
            </RemoteUser>
          </div>
        );
      })}
    </div>
  );
};

export default DefaultLayout;