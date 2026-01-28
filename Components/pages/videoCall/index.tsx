"use client"

import { LocalUser, RemoteUser, useIsConnected, useJoin, useLocalMicrophoneTrack, useLocalCameraTrack, usePublish, useRemoteUsers, RemoteVideoTrack, useRemoteVideoTracks } from "agora-rtc-react";
import { useEffect, useState } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { FaVideo, FaVideoSlash, FaChalkboardUser } from "react-icons/fa6";
import { MdCallEnd, MdChat, MdScreenShare, MdStopScreenShare } from "react-icons/md";
import ChatBox from "./ChatBox";
import './style.css'
import { supabase } from "@/config/supabase";
import { useAppSelector } from "@/store";
import Whiteboard from "./Whiteboard";
import { useNotification } from "@/Components/custom/custom-notification";
import { Button, Modal, Rate, Typography } from "antd";
import Image from "next/image";
import userImage from '@/public/assets/img/userImg.webp'
import { FaLock, FaLockOpen, FaUser } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

export const VideoCall = ({ channelName }: any) => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    return (
        <AgoraRTCProvider client={client}>
            <Basics channelName={channelName} />
        </AgoraRTCProvider>
    );
}

const Basics = ({ channelName }: any) => {
    const [calling, setCalling] = useState(false);
    const isConnected = useIsConnected();
    const [micOn, setMic] = useState(true);
    const [cameraOn, setCamera] = useState(false);
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const channel = channelName[1];
    const [showChatBox, setShowChatBox] = useState(false);
    const [rtcToken, setRtcToken] = useState<string | null>(null);
    const profile = useAppSelector((state) => state.auth);
    const [screenSharing, setScreenSharing] = useState(false);
    const [screenClient] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const [screenTrack, setScreenTrack] = useState<any>(null);
    const [showWhiteBoard, setShowWhiteBoard] = useState(false);
    const { notify } = useNotification();
    const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
    const CALL_DURATION = 3600;
    const [timeLeft, setTimeLeft] = useState<number>(() => {
        const storedStartTime = localStorage.getItem("call_start_time");
        if (storedStartTime) {
            const elapsed = Math.floor((Date.now() - parseInt(storedStartTime)) / 1000);
            return Math.max(CALL_DURATION - elapsed, 0);
        }
        return CALL_DURATION;
    });
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const { Title } = Typography;
    const reviewModal = () => setReviewModalVisible(true);
    const [currentLiveStatus, setCurrentLiveStatus] = useState<"live" | "lock" | "end" | null>(null);
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
    const [ratingValue, setRatingValue] = useState(0);
    const [reviewMessage, setReviewMessage] = useState("");
    const [participant, setParticipant] = useState<any>([]);
    const [host, setHost] = useState<any>(null);
    const remoteUsers = useRemoteUsers();
    const [screenShareUid, setScreenShareUid] = useState<string | number | null | any>(null);
    const videoTracks = useRemoteVideoTracks(remoteUsers);
    const isSharingScreen = videoTracks.videoTracks.find(u => u.trackMediaType);
    const sharedVideo = isSharingScreen?.trackMediaType === "video";
    const searchParam = useSearchParams();
    const isSession = searchParam.get("session");
    const profileId = profile.profileId

    const totalParticipant = remoteUsers.length;

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (calling && isConnected) {

            if (!localStorage.getItem("call_start_time")) {
                localStorage.setItem("call_start_time", Date.now().toString());
            }

            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleEndCall();
                        notify({
                            type: "info",
                            message: "Stream time has been ended",
                        });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            setCountdownInterval(interval);
        }

        return () => {
            clearInterval(interval);
        };
    }, [calling, isConnected]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    };

    useEffect(() => {
        const joinChannel = async () => {
            const { data, error } = await supabase
                .from("Live")
                .select("status")
                .eq("id", channel)
                .single();

            if (error || !data) {
                console.error("Error fetching live status:", error);
                return;
            }

            if (data.status === "end") {
                console.log("Call has already ended.");
                setCurrentLiveStatus("end");
                return;
            }

            const res = await fetch("/api/rtc-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelName: channel }),
            });

            const tokenData = await res.json();
            setRtcToken(tokenData.token);
            setCalling(true);
            setCurrentLiveStatus(data.status);
        };

        if (channel) {
            joinChannel();
        }
    }, [channelName]);

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from("Live")
                    .select("host, participants")
                    .eq("id", channel)
                    .single();

                if (error || !data) {
                    console.error("Error fetching call participants:", error);
                    return;
                }

                const { host, participants } = data;

                if (!Array.isArray(participants)) {
                    console.error("Participants is not an array");
                    return;
                }

                const existingParticipant = participants.find(
                    (p: any) => p.id === profile?.profileId
                );

                if (!existingParticipant && profile) {
                    const updatedParticipants = [...participants, {
                        id: profile.profileId,
                        name: profile.firstName,
                        picture: profile.profileImage,
                        role: "participant"
                    }];

                    const { error: updateError } = await supabase
                        .from("Live")
                        .update({ participants: updatedParticipants })
                        .eq("id", channel);

                    if (updateError) {
                        console.error("Error adding participant:", updateError);
                        return;
                    }
                }

                setHost(host);
                setParticipant(participants);

            } catch (err) {
                console.error("Unexpected Error:", err);
            }
        })();
    }, [channel, remoteUsers, totalParticipant, profile]);

    const handleEndCall = async () => {
        setCalling(false);
        if (countdownInterval) clearInterval(countdownInterval);
        localStorage.removeItem("call_start_time");
        setCurrentLiveStatus("end");
        if (screenSharing) await stopScreenShare();
        reviewModal();

        if (profile.profileId === host) {
            const { error } = await supabase
                .from("Live")
                .update({ status: "end" })
                .eq("id", channel)
                .eq("status", "live");

            if (error) {
                console.error("Error ending live call:", error);
                return
            }

            if (isSession) {
                const { error: eventUpdateError } = await supabase
                    .from("think_tank_events")
                    .update({ status: "end" })
                    .eq("id", isSession);

                if (eventUpdateError) {
                    console.error("Failed to update event status to 'end':", eventUpdateError);
                } else {
                    console.log("Event status updated to 'end'");
                }
            }
        }
    };

    const startScreenShare = async () => {
        try {
            const track = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1", optimizationMode: "detail" });
            const uid = await screenClient.join(appId, channel, rtcToken || null, null);
            await screenClient.publish(track);
            setScreenTrack(track);
            setScreenSharing(true);
            setScreenShareUid(uid);
        } catch (err) {
            console.error("Failed to start screen sharing:", err);
        }
    };

    const stopScreenShare = async () => {
        try {
            if (screenTrack) {
                screenTrack.stop();
                screenTrack.close();
                await screenClient.leave();
                setScreenSharing(false);
                setScreenShareUid(null);
            }
        } catch (err) {
            console.error("Failed to stop screen sharing:", err);
        }
    };

    const toggleScreenShare = () => {
        if (screenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
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
                notify({
                    type: "info",
                    message: `Room status updated to ${newStatus}`
                })
            }

        } catch (err) {
            console.error("Unexpected Error in toggling lock:", err);
        }
    };

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
                        reviewModal();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [channel, isSession, profileId, host]);

    useJoin({ appid: appId, channel, token: rtcToken }, calling);
    usePublish([localMicrophoneTrack, localCameraTrack]);

    // const {
    //     calling,
    //     setCalling,
    //     handleEndCall,
    //     currentLiveStatus,
    //     setCurrentLiveStatus,
    //     reviewModalVisible,
    //     setReviewModalVisible,
    //     reviewModal,
    //     handleRating,
    // } = useLiveSession({ channelName, countdownInterval, stopCallTimer });

    const totalParticipants = 1 + remoteUsers.length;
    const unit = "minmax(0, 1fr) ";

    const gridTemplateColumns =
        totalParticipants === 2
            ? "repeat(2, 1fr)"
            : totalParticipants > 2
                ? unit.repeat(Math.min(totalParticipants, 2)).trim()
                : totalParticipants > 4
                    ? unit.repeat(Math.min(totalParticipants, 3)).trim()
                    : totalParticipants > 9
                        ? unit.repeat(Math.min(totalParticipants, 4)).trim()
                        : unit;

    return (
        <>
            <Modal
                title={
                    <Title level={2}>Rate The Session</Title>
                }
                open={reviewModalVisible}
                onCancel={() => setReviewModalVisible(false)}
                footer={null}
                centered
                width={400}
            >
                <div className='warning-div'>
                    <Rate tooltips={desc} allowHalf style={{ fontSize: 35 }} value={ratingValue} onChange={(value) => setRatingValue(value)} />
                    <textarea
                        name="message"
                        value={reviewMessage}
                        onChange={(e) => setReviewMessage(e.target.value)}
                        style={{ width: "100%", marginTop: 10, border: '1px solid #d7d7d7', borderRadius: 8, padding: 10 }}
                        placeholder="Leave a comment"
                        rows={3}
                    />
                    <Button style={{ marginTop: 10 }} onClick={() => handleRating(channel, profile.profileId!, ratingValue, reviewMessage)}>Submit</Button>
                </div>
            </Modal>
            <div className="video-parent">
                {isConnected && (
                    <div
                        style={{
                            display: "grid", alignItems: "center",
                            gridTemplateColumns: sharedVideo ? "65% 35%" : gridTemplateColumns,
                            gap: 10,
                            padding: "10px 30px",
                            height: "85%"
                        }} className="grid">

                        {!sharedVideo ? (
                            <div style={{ boxShadow: "5px 5px 5px 1px #0c0c0c", borderRadius: 10, overflow: "hidden", width: "100%", height: "100%" }} className="local">
                                <LocalUser
                                    audioTrack={localMicrophoneTrack}
                                    cameraOn={cameraOn}
                                    micOn={micOn}
                                    playAudio={false}
                                    videoTrack={localCameraTrack}
                                    style={{ backgroundColor: '#0e0e0e', width: '100%', height: "100%" }}
                                >
                                    {!cameraOn && (
                                        <div className="call-user-div">
                                            <Image style={{ borderRadius: "100%" }} src={profile.profileImage || userImage} alt={"userimg"} width={100} height={100} />
                                            {!profile.profileId ? <span style={{ color: "#fff" }}>Anonymous mode</span> : <span style={{ color: "#fff" }}>{profile.firstName + " (You)"}</span>}
                                        </div>
                                    )}
                                </LocalUser>
                            </div>
                        ) : (
                            <div style={{ boxShadow: "5px 5px 5px 1px #0c0c0c", borderRadius: 10, overflow: "hidden", width: "100%", height: "100%" }} className="local">
                                {videoTracks.videoTracks.map((track: any) => (
                                    <RemoteVideoTrack key={track.getUserId()} play track={track} style={{ width: '100%', height: "100%" }} />
                                ))}
                            </div>
                        )}

                        {remoteUsers && (remoteUsers?.length > 0) && (
                            <div style={{ height: "100%", display: "flex", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {remoteUsers.filter(user => user.uid !== isSharingScreen?.getUserId()).map((remoteUser) => {
                                    const matchedParticipants = participant?.find((p: any) => p.id !== profile.profileId)
                                    const isSharingScreen = remoteUser.hasVideo;
                                    const isCameraOn = remoteUser.videoTrack && remoteUser.videoTrack.isPlaying;

                                    return (
                                        <div style={{ boxShadow: "5px 5px 5px 1px #0c0c0c", borderRadius: 10, overflow: "hidden", width: sharedVideo ? "300px" : "100%", height: sharedVideo ? "200px" : "100%" }} className="remote" key={remoteUser.uid}>
                                            <RemoteUser user={remoteUser} style={{ backgroundColor: '#0e0e0e', width: '100%', height: "100%" }}>
                                                {isCameraOn ? (
                                                    null
                                                ) : matchedParticipants ? (
                                                    <div key={matchedParticipants.id} className="call-user-div" style={{ fontWeight: matchedParticipants.role === "host" ? "bold" : "normal" }}>
                                                        <Image style={{ borderRadius: "100%" }} src={matchedParticipants.picture || userImage} alt={matchedParticipants.name} width={100} height={100} />
                                                        <span style={{ color: "#fff" }}>{matchedParticipants.name} {matchedParticipants.role === "host" && "(Host)"}</span>
                                                    </div>
                                                ) : (
                                                    <div className="call-user-div">
                                                        <Image style={{ borderRadius: "100%" }} src={userImage} alt="userImg" width={100} height={100} />
                                                        <span style={{ color: "#fff" }}>Anonymous</span>
                                                    </div>
                                                )}
                                            </RemoteUser>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                    </div>
                )}
                {!isConnected && currentLiveStatus !== "end" && (
                    <div className="call-fallback-div">
                        <p>Connecting to Channel: <strong>{channel}</strong>...</p>
                    </div>
                )}
                {isConnected && (
                    <>
                        <div style={{ padding: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                                <button className="video-icons" onClick={() => setMic(a => !a)}>
                                    {micOn ? <AiOutlineAudio /> : <AiOutlineAudioMuted />}
                                </button>
                                <button className="video-icons" onClick={() => setCamera(a => !a)}>
                                    {cameraOn ? <FaVideo /> : <FaVideoSlash />}
                                </button>
                                <button className="video-icons" style={{ backgroundColor: screenSharing ? "orange" : "#3A3A3A", color: "white" }} onClick={toggleScreenShare}>
                                    {screenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
                                </button>
                                <button className="video-icons" style={{ backgroundColor: "red", color: "white" }} onClick={calling ? handleEndCall : () => setCalling(a => !a)}>
                                    {calling && (<MdCallEnd />)}
                                </button>
                                <button className="video-icons" style={{ backgroundColor: showWhiteBoard ? "orange" : "#3A3A3A", color: "white" }} onClick={() => setShowWhiteBoard(!showWhiteBoard)}>
                                    <FaChalkboardUser />
                                </button>
                                <button className="video-icons" style={{ backgroundColor: currentLiveStatus === "lock" ? "orange" : "#3A3A3A", color: "white" }} onClick={handleLockRoom}>
                                    <FaLock />
                                </button>
                            </div>
                        </div>
                        <div className="float-box" style={{ position: "absolute", top: 10, right: 20 }}>
                            {formatTime(timeLeft)} left
                        </div>
                        <div className="float-box" style={{ position: "absolute", top: 10, left: 20 }}>
                            <FaUser /> {totalParticipant}
                        </div>
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
                {showWhiteBoard && (
                    <Whiteboard />
                )}
            </div>
        </>
    );
};

export default VideoCall;