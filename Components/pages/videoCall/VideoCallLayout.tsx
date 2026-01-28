import { useState, useEffect, useMemo } from "react";
import { LocalUser, RemoteUser, useIsConnected, useJoin, useLocalMicrophoneTrack, useLocalCameraTrack, usePublish, useRemoteUsers, useCurrentUID } from "agora-rtc-react";
import { useAppSelector } from "@/store";
import { supabase } from "@/config/supabase";
import { useNotification } from "@/Components/custom/custom-notification";
import { useCallTimer } from "@/hooks/videoCall/useCallTimer";
import { useScreenShare } from "@/hooks/videoCall/useScreenShare";
import { useParticipants } from "@/hooks/calling/useParticipants";
import FloatingStats from "./FloatingStats";
import ChatBox from "./ChatBox";
import { MdChat } from "react-icons/md";
import Whiteboard from "./Whiteboard";
import Image from "next/image";
import userImage from '@/public/assets/img/userImg.webp'
import ReviewModal from "./ReviewModal";
import Controls from "@/Components/custom/video-call-controls";
import { useJoinChannel } from "@/hooks/calling/useJoinChannel";
import useMediaControls from "@/hooks/calling/useMediaControl";
import { useSearchParams } from "next/navigation";
import SetNextCallModal from "./SetNextCallModal";
import DefaultLayout from "./DefaultLayout";
import ScreenShareLayout from "./DefaultLayout/ScreenShareLayout";
import bgImage from '@/public/assets/img/video-call-bg.jpg'
import { generateRandomColor } from "@/lib/generateRandomColor";
import { collabRoomNextEventUpdate } from "@/lib/collabRoomNotifications";
import dayjs from "dayjs";
import useActiveSpeakers from "@/hooks/useActiveSpeakers";

const VideoCallLayout = ({ channelName }: any) => {
    const profile = useAppSelector((state) => state.auth);
    const remoteUsers = useRemoteUsers();
    const isConnected = useIsConnected();
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [reviewMessage, setReviewMessage] = useState("");
    const { notify } = useNotification();
    const channel = useMemo(() => channelName[1], [channelName]);
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const [showWhiteBoard, setShowWhiteBoard] = useState(false);
    const [showChatBox, setShowChatBox] = useState(false);
    const { micOn, setMic, cameraOn, setCamera } = useMediaControls();
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);
    const [screenSharingUser, setScreenSharingUser] = useState<number | any>(null);
    const [hostAgoraId, setHostAgoraId] = useState<number | any>(null);
    const currentUid = useCurrentUID();
    const searchParams = useSearchParams();
    const isSession = searchParams.get("session");
    const [sessionModal, setSessionModal] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const activeSpeakers = useActiveSpeakers(200);

    const isSpeaking = (uid?: string | number) => {
        if (uid === undefined || uid === null) return false;
        return activeSpeakers.some((s) => String(s) === String(uid));
    };

    const { rtcToken, currentLiveStatus, calling, setCalling, setCurrentLiveStatus } = useJoinChannel("/api/video-call-rtc-token", channel, "Live");

    const { host, participants, addOrUpdateParticipant, removeParticipant } = useParticipants(channel, profile, "Live", currentUid);
    const { screenSharing, stopScreenShare, toggleScreenShare } = useScreenShare(appId, channel, rtcToken, setScreenSharingUser, currentUid);

    useEffect(() => {
        if (!profile?.profileId || !currentUid) return;

        const joinCall = async () => {
            await addOrUpdateParticipant({
                id: profile.profileId,
                name: profile.firstName || "Anonymous",
                picture: profile.profileImage || userImage.src,
                role: profile.profileId === host ? "host" : "participant"
            });
        };

        joinCall();

        // Cleanup function to remove participant when they leave
        return () => {
            if (profile?.profileId) {
                removeParticipant(profile.profileId);
            }
        };
    }, [profile, currentUid, host]);

    // Detect mobile view based on screen width
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth <= 1024);
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

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

    // Guard against stale screen-sharing state from DB: if the indicated screen sharer
    // is not currently present in remote users, clear it so local video is not hidden.
    useEffect(() => {
        if (screenSharingUser !== null) {
            const hasScreenSharer = Array.isArray(remoteUsers) && remoteUsers.some((u: any) => u?.uid === screenSharingUser);
            if (!hasScreenSharer) {
                setScreenSharingUser(null);
            }
        }
    }, [remoteUsers, screenSharingUser]);

    useEffect(() => {
        if (isConnected && currentUid && profile.profileId === host) {
            const updateHostAgoraId = async () => {
                const { data, error } = await supabase
                    .from("Live")
                    .update({ host_agora_id: currentUid })
                    .eq("id", channel)
                    .select('host_agora_id')
                    .maybeSingle()

                if (error) {
                    console.error("Error updating host agora_id:", error);
                }
                setHostAgoraId(data?.host_agora_id)
            };

            updateHostAgoraId();
        }
    }, [isConnected, currentUid, profile.profileId, host, channel]);

    const handleEndCall = async () => {
        setCalling(false);
        if (countdownInterval) clearInterval(countdownInterval);
        localStorage.removeItem("call_start_time");
        setCurrentLiveStatus("end");
        if (screenSharing) await stopScreenShare();

        if (profile.profileId === host) {
            const { error } = await supabase
                .from("Live")
                .update({ status: "end" })
                .eq("id", channel)
                .eq("status", "live");

            if (error) {
                console.error("Error ending live call:", error);
                return
            } else if (isSession) {
                const { error } = await supabase
                    .from("think_tank_events")
                    .update({ status: "end" })
                    .eq("id", isSession)
                if (error) {
                    console.error("Error ending live session:", error);
                    return
                }
            }
            setSessionModal(true)
        } else {
            setReviewModalVisible(true)
        }

        notify({ type: "info", message: "Stream Ended" });
    };

    const { timeLeft, countdownInterval } = useCallTimer(channel, calling, isConnected, handleEndCall);

    const handleRating = async (channelId: string, participantId: string, rating: number, message?: string) => {
        try {
            const { error } = await supabase.from("review").insert([
                {
                    live_id: channelId,
                    participant_id: participantId,
                    rating,
                    message: message?.trim() || null,
                },
            ]);

            if (error) {
                console.error("Failed to submit rating:", error);
            } else {
                notify({
                    type: "success",
                    message: "Thanks for your feedback!",
                });
                setReviewModalVisible(false);
                setRatingValue(0);
                setReviewMessage("");
            }
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    const handleLockRoom = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("Live")
                .select("id, status")
                .eq("id", channel)
                .single();

            if (fetchError || !data) {
                console.error("Failed to fetch current live status:", fetchError);
                return;
            }

            const newStatus = data.status === "lock" ? "live" : "lock";

            const { error: updateError } = await supabase
                .from("Live")
                .update({ status: newStatus })
                .eq("id", channel);

            if (updateError) {
                console.error("Error toggling lock status:", updateError);
            } else {
                setCurrentLiveStatus(newStatus);
                console.log(`Room status updated to ${newStatus}`);
                notify({ type: "info", message: `Room status updated to ${newStatus}` })
            }

        } catch (err) {
            console.error("Unexpected Error in toggling lock:", err);
        }
    };

    const getInitialScreenShareState = async () => {
        const { data, error } = await supabase
            .from("Live")
            .select("agora_id")
            .eq("id", channel)
            .maybeSingle();

        console.log("error", data, error);


        if (data && !error && data.agora_id) {
            console.log("DATATTA ", data)
            setScreenSharingUser(data.agora_id);
        }
    };

    const handleScheduleCall = async (nextCallDate: Date, nextCallTime: Date) => {
        try {
            const { data: liveData, error: liveDataError } = await supabase
                .from('Live')
                .select("think_tank_id, host")
                .eq('id', channel)
                .single()

            if (liveDataError) {
                console.error("Error fetching room id:", liveDataError)
                return
            }

            const { data: updatedData, error: updateError } = await supabase
                .from("thinktank")
                .update({ next_session_date: nextCallDate, next_session_time: nextCallTime })
                .eq("id", liveData.think_tank_id)
                .select("*")
                .single()

            if (updateError) {
                console.error("Error setting next call time:", updateError)
                return
            }

            const { data: roomParticipant, error: participantError } = await supabase
                .from("think_tank_participants")
                .select("*")
                .eq("think_tank_id", liveData.think_tank_id)

            if (participantError) {
                console.error("Error fetching participant:", participantError)
                return
            }

            if (liveData.host === profile.profileId) {
                const sessionDateFormatted = `${dayjs(nextCallDate).format('YYYY-MM-DD')} at ${dayjs(nextCallTime).format('HH:mm')}`;

                const participants = roomParticipant || [];

                for (const participant of participants) {
                    if (participant.participant_id !== liveData.host) {
                        try {
                            await collabRoomNextEventUpdate(
                                liveData.host,
                                participant.participant_id,
                                updatedData.title,
                                liveData.think_tank_id,
                                sessionDateFormatted
                            );
                        } catch (error) {
                            console.error(`Failed to send notification to participant ${participant.id}`, error);
                        }
                    }
                }
            }

            notify({ type: "success", message: "Session scheduled" })

        } catch (error) {
            console.error("Unexpected Error while setting next session:", error);
        }
    };

    useEffect(() => {
        const subscription = supabase
            .channel(`live-status-${channel}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'Live',
                    filter: `id=eq.${channel}`,
                },
                async (payload: any) => {
                    const status = payload.new?.status;
                    if (status === "end") {
                        setCalling(false);
                        if (countdownInterval) clearInterval(countdownInterval);
                        localStorage.removeItem("call_start_time");
                        setCurrentLiveStatus("end");
                        if (screenSharing) await stopScreenShare();
                        setReviewModalVisible(true);
                    }
                    const screenSharingData = payload.new?.agora_id;
                    if (screenSharingData) {
                        setScreenSharingUser(screenSharingData);
                    } else {
                        setScreenSharingUser(screenSharingData);
                    }
                }
            )
            .subscribe();

        getInitialScreenShareState();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [channel, profile.profileId, host]);

    useJoin({ appid: appId, channel, token: rtcToken }, calling);
    usePublish([localMicrophoneTrack, localCameraTrack]);

    return (
        <>
            <ReviewModal open={reviewModalVisible} onClose={() => setReviewModalVisible(false)} onSubmit={() => handleRating(channel, profile.profileId!, ratingValue, reviewMessage)} rating={ratingValue} onRatingChange={(value) => setRatingValue(value)} onMessageChange={(e) => setReviewMessage(e.target.value)} reviewMessage={reviewMessage} />
            {profile?.profileId === host && (
                <SetNextCallModal
                    open={sessionModal}
                    onClose={() => setSessionModal(false)}
                    onSubmit={handleScheduleCall}
                />
            )}
            <div className="video-parent">
                <div className="bg-image-container">
                    <Image
                        src={bgImage}
                        alt="Background Image"
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        className="bg-image"
                    />
                </div>
                {isConnected && (
                    screenSharingUser ? (
                        isMobileView ? (
                            <ScreenShareLayout
                                cameraOn={cameraOn}
                                localCameraTrack={localCameraTrack}
                                localMicrophoneTrack={localMicrophoneTrack}
                                micOn={micOn}
                                participants={participants}
                                profile={profile}
                                remoteUsers={remoteUsers}
                                userImage={userImage.src}
                                screenSharingUser={screenSharingUser}
                            />
                        ) : (
                            /* Desktop Screen Share Layout */
                            <div className="video-call-container">
                                <div className="local">
                                    {(() => {
                                        const shareUser = Array.isArray(remoteUsers) ? remoteUsers.find((u: any) => u?.uid === screenSharingUser) : null;
                                        const firstActiveRemote = Array.isArray(remoteUsers)
                                            ? remoteUsers.find((u: any) => u?.videoTrack && u.videoTrack.isPlaying)
                                            : null;
                                        const mainStageUser = shareUser || firstActiveRemote;
                                        if (mainStageUser) {
                                            return (
                                                <RemoteUser user={mainStageUser} className={`call-div ${isSpeaking(mainStageUser.uid) ? 'speaking-border' : ""}`} style={{ background: userColors[mainStageUser.uid || "local"] }} />
                                            );
                                        }
                                        return (
                                            <LocalUser
                                                audioTrack={localMicrophoneTrack}
                                                cameraOn={cameraOn}
                                                micOn={micOn}
                                                playAudio={false}
                                                videoTrack={localCameraTrack}
                                                className="call-div"
                                                style={{ background: userColors[profile.profileId || "local"] }}
                                            >
                                                {!cameraOn && (
                                                    <div className="call-user-div" style={{ display: 'flex', flexDirection: 'row', position: 'absolute', top: "90%", left: "5%", gap: 10, height: "fit-content" }}>
                                                        <Image style={{ borderRadius: "100%", width: 40, height: 40 }} src={profile.profileImage || userImage} alt={"userimg"} width={100} height={100} />
                                                        {!profile.profileId ? <span style={{ color: "#fff" }}>Anonymous mode</span> : <span style={{ color: "#fff" }}>{profile.firstName + " (You)"}</span>}
                                                    </div>
                                                )}
                                            </LocalUser>
                                        );
                                    })()}
                                </div>
                                {remoteUsers && (remoteUsers.length > 0) && (
                                    <div className="remote-users-div">
                                        {(() => {
                                            const shareUser = Array.isArray(remoteUsers) ? remoteUsers.find((u: any) => u?.uid === screenSharingUser) : null;
                                            const firstActiveRemote = Array.isArray(remoteUsers)
                                                ? remoteUsers.find((u: any) => u?.videoTrack && u.videoTrack.isPlaying)
                                                : null;
                                            const mainStageUser = shareUser || firstActiveRemote;
                                            const usersToShow = mainStageUser
                                                ? remoteUsers.filter((remoteUser) => remoteUser?.uid !== mainStageUser.uid)
                                                : remoteUsers;

                                            const tiles: any[] = [];

                                            if (mainStageUser) {
                                                tiles.push(
                                                    <div className="remote" key="local-thumb">
                                                        <LocalUser
                                                            audioTrack={localMicrophoneTrack}
                                                            cameraOn={cameraOn}
                                                            micOn={micOn}
                                                            playAudio={false}
                                                            videoTrack={localCameraTrack}
                                                            className="call-div"
                                                            style={{ background: userColors[profile.profileId || "local"] }}
                                                        >
                                                            {!cameraOn && (
                                                                <div className="call-user-div" style={{ display: 'flex', flexDirection: 'row', position: 'absolute', top: "70%", left: "5%", gap: 10, height: "fit-content" }}>
                                                                    <Image style={{ borderRadius: "100%", width: 40, height: 40 }} src={profile.profileImage || userImage} alt={"userimg"} width={100} height={100} />
                                                                    {!profile.profileId ? <span style={{ color: "#fff" }}>Anonymous mode</span> : <span style={{ color: "#fff" }}>{profile.firstName + " (You)"}</span>}
                                                                </div>
                                                            )}
                                                        </LocalUser>
                                                    </div>
                                                );
                                            }

                                            usersToShow.forEach((remoteUser) => {
                                                const matchedParticipants = participants?.find((p: any) => p.agora_uid === remoteUser.uid)
                                                const isCameraOn = remoteUser.videoTrack && remoteUser.videoTrack.isPlaying;
                                                const isUserHost = matchedParticipants && matchedParticipants.role === "host";
                                                const userName = matchedParticipants ? matchedParticipants.name : "Anonymous";
                                                const userImageSrc = matchedParticipants ? matchedParticipants.picture || userImage : userImage;
                                                tiles.push(
                                                    <div className={`remote ${isSpeaking(remoteUser.uid) ? 'speaking-border' : ""}`} key={remoteUser.uid}>
                                                        <RemoteUser user={remoteUser} className="call-div" style={{ background: userColors[remoteUser.uid || "remote"] }}>
                                                            {isCameraOn ? null : matchedParticipants ? (
                                                                <div key={matchedParticipants?.agora_uid} className="call-user-div" style={{ fontWeight: isUserHost ? "bold" : "normal", display: 'flex', flexDirection: 'row', position: 'absolute', top: "70%", left: "5%", gap: 10, height: "fit-content" }}>
                                                                    <Image style={{ borderRadius: "100%", width: 40, height: 40 }} src={userImageSrc} alt={userName} width={100} height={100} />
                                                                    <span style={{ color: "#fff" }}>{userName} {isUserHost && "(Host)"}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="call-user-div" key={matchedParticipants?.agora_uid}>
                                                                    <Image style={{ borderRadius: "100%", width: 40, height: 40 }} src={userImage} alt={userName} width={100} height={100} />
                                                                    <span style={{ color: "#fff" }}>Anonymous</span>
                                                                </div>
                                                            )}
                                                        </RemoteUser>
                                                    </div>
                                                );
                                            });

                                            return tiles;
                                        })()}
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <DefaultLayout
                            cameraOn={cameraOn}
                            localCameraTrack={localCameraTrack}
                            micOn={micOn}
                            localMicrophoneTrack={localMicrophoneTrack}
                            profile={profile}
                            participants={participants}
                            remoteUsers={remoteUsers}
                            userImage={userImage.src}
                        />
                    )
                )}
                {!isConnected && currentLiveStatus !== "end" && (
                    <div className="call-fallback-div">
                        <p>Connecting to Channel: <strong>{channel}</strong>...</p>
                    </div>
                )}
                {isConnected && (
                    <>
                        <Controls
                            micOn={micOn}
                            setMic={setMic}
                            calling={calling}
                            cameraOn={cameraOn}
                            setCamera={setCamera}
                            screenSharing={screenSharing}
                            toggleScreenShare={toggleScreenShare}
                            handleEndCall={handleEndCall}
                            showWhiteBoard={showWhiteBoard}
                            setShowWhiteBoard={setShowWhiteBoard}
                            currentLiveStatus={currentLiveStatus!}
                            handleLockRoom={handleLockRoom}
                            setCalling={setCalling}
                            channelID={channel}
                            duration={timeLeft}
                        />
                        <FloatingStats timeLeft={timeLeft} totalParticipant={remoteUsers} />
                    </>
                )}
                {currentLiveStatus === "end" && (
                    <div className="call-fallback-div">
                        <p>Call Ended.</p>
                    </div>
                )}
                {showChatBox && (<ChatBox channelName={channel} userId={profile.profileId} />)}
                <div className="chat-icon-div" onClick={() => setShowChatBox(!showChatBox)}>
                    <MdChat />
                </div>
                {
                    showWhiteBoard && (
                        <Whiteboard />
                    )
                }
            </div >
        </>
    )
};

export default VideoCallLayout;