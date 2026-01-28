import React, { useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import { Skeleton, Slider, Alert, Button } from 'antd'
import Image from 'next/image'
import { supabase } from '@/config/supabase'
import { useAppSelector } from '@/store'
import { LocalUser, RemoteUser, useIsConnected } from 'agora-rtc-react'
import useMediaControls from '@/hooks/calling/useMediaControl'
import useLiveStreamData from '@/hooks/liveStream/useLiveStreamData'
import useElapsedTime from '@/hooks/liveStream/useElapsedTime'
import { useJoinChannel } from '@/hooks/calling/useJoinChannel'
import { useAgoraLiveRole } from '@/hooks/liveStream/useAgoraLiveRole'
import userImage from '@/public/assets/img/userImg.webp'
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { FaVideo, FaVideoSlash } from "react-icons/fa6";
import { useNotification } from '@/Components/custom/custom-notification'
import { IoMdVolumeHigh } from "react-icons/io";
import InviteParticipantModal from './InviteParticipantModal'
import { MdStopScreenShare, MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { MdAddToQueue } from "react-icons/md";
import { LuScreenShare } from "react-icons/lu";
import CoHostInvitationModal from './CoHostInvitationModal'
import { LuUsers } from "react-icons/lu";
import clsx from 'clsx'
import { FiArrowUpLeft } from "react-icons/fi";

const SoundScapeStream = ({ client, liveStreamId, roomId, room }: { client: any, liveStreamId: string, roomId: string, room: any }) => {
    const profile = useAppSelector((state) => state.auth);
    const stream = liveStreamId;
    const isConnected = useIsConnected();
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const { participants: initialParticipants, host, created_at, streamType } = useLiveStreamData(stream, profile);
    const [participants, setParticipants] = useState(initialParticipants);
    const elapsedTime = useElapsedTime(created_at);
    const shouldShowCamera = !(streamType === "audio_Chat" || streamType === "chat_Only");
    const isSoundScape = room.room_type === 'soundscape' || room.room_type === 'open_collab';
    const shouldShowMic = streamType !== "chat_Only";
    const { micOn, setMic, cameraOn, setCamera } = useMediaControls(shouldShowMic, shouldShowCamera);
    const isHost = host.id === profile.profileId;
    const uid = isHost && host.id ? host.id : profile.profileId!;
    const [isCoHost, setIsCoHost] = useState(participants.some(
        (p: any) => p.id === profile.profileId && p.stream_role === 'co-host' && p.invitation_status === 'accepted'
    ))
    const { rtcToken, calling, setCalling } = useJoinChannel(
        "/api/rtc-token",
        stream,
        "live_stream",
        isHost,
        isCoHost,
        "liveStream"
    );
    const { notify } = useNotification();
    const [volume, setVolume] = useState(100);
    const { localMicrophoneTrack, localCameraTrack, remoteUsers, startScreenShare, stopScreenShare, screenTrack, setScreenTrack, screenShareInfo } = useAgoraLiveRole({
        client,
        isHost,
        isCoHost,
        appId,
        channel: stream,
        token: rtcToken,
        uid,
        calling,
        micOn,
        cameraOn
    });
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const containerRef = useRef(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const cameraRef = useRef<HTMLDivElement | null>(null);
    const screenRef = useRef<HTMLDivElement | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [screenShareNotification, setScreenShareNotification] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const streamContainerRef = useRef<HTMLDivElement>(null);

    const canStream = isHost || isCoHost;

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (initialParticipants) {
            setParticipants(initialParticipants);
        }
    }, [initialParticipants]);

    useEffect(() => {
        if (!profile?.profileId || !liveStreamId) return;

        const channel = supabase
            .channel(`cohost-updates-${liveStreamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'live_stream',
                    filter: `id=eq.${liveStreamId}`,
                },
                (payload: any) => {
                    const next = payload.new;
                    if (!next) return;

                    const updatedParticipants = next.participants || [];

                    setParticipants(updatedParticipants);

                    const myParticipant = updatedParticipants.find(
                        (p: any) => p.id === profile.profileId
                    );
                    const isNowCoHost = myParticipant?.stream_role === 'co-host' &&
                        myParticipant?.invitation_status === 'accepted';
                    setIsCoHost(isNowCoHost);

                    console.log('Realtime update -> participants:', updatedParticipants);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.profileId, liveStreamId]);

    const getRemoteTracksInfo = () => {
        let remoteScreenUser: any = null;
        let remoteCameraUsers: any[] = [];

        remoteUsers.forEach((remoteUser) => {
            const userUid = String(remoteUser.uid);

            if (userUid.includes('_screen')) {
                remoteScreenUser = remoteUser;
            } else {
                remoteCameraUsers.push(remoteUser);
            }
        });

        return { remoteScreenUser, remoteCameraUsers };
    };

    const { remoteScreenUser, remoteCameraUsers } = getRemoteTracksInfo();

    const isScreenSharing = screenTrack !== null || remoteScreenUser !== null;

    useEffect(() => {
        if (remoteScreenUser && !isHost) {
            const sharerUid = String(remoteScreenUser.uid).replace('_screen', '');
            const sharer = participants.find((p: any) => p.id === sharerUid);
            const displayName = screenShareInfo || 'their screen';

            setScreenShareNotification(`${sharer?.name || 'Host'} began screen share: ${displayName}`);

            notify({
                type: 'info',
                message: `K.${sharer?.name || 'Host'} is sharing ${displayName}`,
            });

            const timer = setTimeout(() => {
                setScreenShareNotification(null);
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            setScreenShareNotification(null);
        }
    }, [remoteScreenUser, isHost, participants, screenShareInfo]);

    useEffect(() => {
        if (localCameraTrack && cameraRef.current) {
            localCameraTrack.play(cameraRef.current);
        }

        return () => {
            localCameraTrack?.stop();
        };
    }, [localCameraTrack]);

    useEffect(() => {
        if (screenTrack && screenRef.current) {
            screenTrack.play(screenRef.current);
        } else if (remoteScreenUser?.videoTrack && screenRef.current) {
            remoteScreenUser.videoTrack.play(screenRef.current);
        }

        return () => {
            screenTrack?.stop();
            remoteScreenUser?.videoTrack?.stop?.();
        };
    }, [screenTrack, remoteScreenUser]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).msFullscreenElement);
            setIsFullscreen(isCurrentlyFullscreen);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) {
                exitFullscreen();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    const inviteParticipant = async (participantId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('live_stream')
                .select('participants')
                .eq('id', liveStreamId)
                .single();

            if (fetchError) throw fetchError;

            const participants = data.participants || [];

            const existingCoHost = participants.find((p: any) =>
                p.stream_role === 'co-host' && p.invitation_status === 'accepted'
            );
            if (existingCoHost && existingCoHost.id !== participantId) {
                notify({
                    type: 'warning',
                    message: `Only one co-host is allowed. Remove ${existingCoHost.name} first.`,
                });
                return;
            }

            const updatedParticipants = participants.map((p: any) => {
                if (p.id === participantId) {
                    return { ...p, stream_role: 'co-host', invitation_status: 'pending' };
                }
                return p;
            });

            const { error: updateError } = await supabase
                .from('live_stream')
                .update({ participants: updatedParticipants })
                .eq('id', liveStreamId);

            if (updateError) throw updateError;

            notify({
                type: 'success',
                message: 'Invitation sent successfully',
            });
        } catch (error) {
            console.error('Error inviting participant:', error);
            notify({ type: 'error', message: 'Failed to invite participant' });
        }
    };

    const removeParticipant = async (participantId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('live_stream')
                .select('participants')
                .eq('id', liveStreamId)
                .single();

            if (fetchError) throw fetchError;

            const updatedParticipants = data.participants.map((p: any) => {
                if (p.id === participantId) {
                    return { ...p, stream_role: 'audience', invitation_status: null };
                }
                return p;
            });

            const { error: updateError } = await supabase
                .from('live_stream')
                .update({ participants: updatedParticipants })
                .eq('id', liveStreamId);

            if (updateError) throw updateError;

            notify({ type: 'success', message: 'Participant removed successfully' });
        } catch (error) {
            console.error('Error removing participant:', error);
            notify({ type: 'error', message: 'Failed to removed participant' });
        }
    };

    React.useEffect(() => {
        if (!isHost && isConnected) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log("Audio permissions granted for audience");
                })
                .catch((error) => {
                    console.error("Audio permissions denied for audience:", error);
                });
        }
    }, [isHost, isConnected]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !(containerRef.current as HTMLElement).contains(event.target as Node)) {
                setShowVolumeControl(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEndStream = async (id: string) => {
        try {
            const { error } = await supabase
                .from("live_stream")
                .update({ status: "end" })
                .eq("id", id)

            if (error) {
                console.error("Error Ending Stream");
                return;
            }

            setCalling(false)
            setMic(false)
            setCamera(false)
            setScreenTrack(null);
            stopScreenShare()
            notify({ type: "info", message: "Stream Ended." })

        } catch (err) {
            console.error("Unexpected Error while ending stream", err)
        }
    }

    const handleScreenShare = () => {
        if (isMobile && isHost) {
            notify({
                type: 'warning',
                message: 'Screen sharing is only available on desktop devices',
                duration: 10
            });
            return;
        }
        startScreenShare();
    };

    const enterFullscreen = async () => {
        if (!streamContainerRef.current) return;

        try {
            if (streamContainerRef.current.requestFullscreen) {
                await streamContainerRef.current.requestFullscreen();
            } else if ((streamContainerRef.current as any).webkitRequestFullscreen) {
                await (streamContainerRef.current as any).webkitRequestFullscreen();
            } else if ((streamContainerRef.current as any).msRequestFullscreen) {
                await (streamContainerRef.current as any).msRequestFullscreen();
            }
        } catch (error) {
            console.error('Error entering fullscreen:', error);
            notify({
                type: 'error',
                message: 'Failed to enter fullscreen mode'
            });
        }
    };

    const exitFullscreen = async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (error) {
            console.error('Error exiting fullscreen:', error);
            notify({
                type: 'error',
                message: 'Failed to exit fullscreen mode'
            });
        }
    };

    const toggleFullscreen = () => {
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };

    useEffect(() => {
        if (isCoHost && !isHost) {
            const myParticipant = participants.find((p: any) => p.id === profile.profileId);
            if (myParticipant?.invitation_status === 'accepted') {
                notify({
                    type: 'success',
                    message: 'You can now share your camera and microphone!'
                });
            }
        }
    }, [isCoHost, isHost, participants, profile.profileId]);

    if (!streamType) {
        return <div className={styles.soundscapeStreamContainer}><Skeleton active /></div>;
    }

    const getFilteredCameraUsers = () => {
        return remoteCameraUsers.filter((remoteUser) => {
            const userInfo = participants.find((p) => p.id === remoteUser.uid);
            return userInfo?.stream_role === 'co-host' || userInfo?.stream_role === 'host';
        });
    };

    // Helper function to truncate text to 19 characters
    const truncateText = (text: string | undefined, maxLength: number = 19) => {
        if (!text) return '';
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    return (
        <div className={styles.soundscapeStreamContainer}>
            <div ref={streamContainerRef} className={`${styles.streamContainer} ${isFullscreen ? styles.fullscreenContainer : ''}`}>
                <CoHostInvitationModal />
                <div className={styles.streamBox}>
                    {(isHost && isScreenSharing) && (
                        <div className={styles.screenSharingBanner}>
                            <span className={styles.bannerHeading}>You're sharing your entire screen.</span>
                            <span className={styles.screenSharingIcon}><LuScreenShare /></span>
                        </div>
                    )}
                    {screenShareNotification && !isHost && (
                        <Alert
                            message={screenShareNotification}
                            type="info"
                            showIcon
                            closable
                            onClose={() => setScreenShareNotification(null)}
                            style={{
                                margin: '10px',
                                borderRadius: '8px'
                            }}
                        />
                    )}
                    <div className={`${styles.streamBoxContent}`}>
                        <div className={styles.streamInfoOverlay}>
                            <div className={styles.streamStatus}>
                                <span className={styles.statusDot}></span>
                                <span className={styles.streamBoxTitle}>Live</span>
                            </div>
                            <div className={styles.elapsedTime}>
                                {elapsedTime}
                            </div>
                        </div>
                        {isScreenSharing && (
                            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                {isHost && screenTrack && (
                                    <div
                                        ref={screenRef}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "black",
                                        }}
                                    />
                                )}

                                {!isHost && remoteScreenUser && (
                                    <RemoteUser
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        user={remoteScreenUser}
                                        playAudio={false}
                                        playVideo={true}
                                    />
                                )}

                                {isHost && screenTrack && cameraOn && localCameraTrack && (
                                    <LocalUser
                                        style={{
                                            position: "absolute",
                                            bottom: 20,
                                            right: '5%',
                                            width: 200,
                                            height: 150,
                                            borderRadius: 15,
                                            overflow: "hidden",
                                            border: "2px solid #fff",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                            zIndex: 10,
                                        }}
                                        audioTrack={localMicrophoneTrack}
                                        cameraOn={cameraOn}
                                        micOn={micOn}
                                        playAudio={false}
                                        videoTrack={localCameraTrack}
                                    />
                                )}

                                {!isHost && remoteScreenUser && getFilteredCameraUsers().map((remoteUser, index) => {
                                    if (remoteUser.audioTrack?.setVolume) {
                                        remoteUser.audioTrack.setVolume(volume);
                                    }
                                    const userInfo = participants.find(p => p.id === remoteUser.uid);
                                    const hasVideo = (remoteUser.hasVideo && remoteUser.videoTrack) && remoteUser.videoTrack.isPlaying;

                                    return (
                                        <div
                                            key={remoteUser.uid}
                                            style={{
                                                position: "absolute",
                                                bottom: 20,
                                                right: `${5 + (index * 220)}px`,
                                                width: 200,
                                                height: 150,
                                                borderRadius: 15,
                                                overflow: "hidden",
                                                border: "2px solid #fff",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                                zIndex: 10,
                                                backgroundColor: "#1a1a1a",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {hasVideo ? (
                                                <RemoteUser
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                    }}
                                                    user={remoteUser}
                                                    playAudio={true}
                                                    playVideo={true}
                                                />
                                            ) : (
                                                <div className={styles.streamBoxUserDetails}>
                                                    <Image
                                                        style={{ borderRadius: "100%" }}
                                                        src={userInfo?.picture || userImage}
                                                        alt="userimg"
                                                        width={100}
                                                        height={100}
                                                    />
                                                    <span style={{ color: "#fff" }}>
                                                        <span style={{ color: "#F9B100" }}>K.</span>
                                                        {userInfo?.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!isScreenSharing && (
                            isConnected && canStream ? (
                                <>
                                    <div className={styles.videoBoxWrapper}>
                                        <LocalUser
                                            audioTrack={localMicrophoneTrack}
                                            cameraOn={cameraOn}
                                            micOn={micOn}
                                            playAudio={false}
                                            videoTrack={localCameraTrack}
                                        >
                                            {!cameraOn && (
                                                <div className={styles.streamBoxUserDetails}>
                                                    <Image
                                                        style={{ borderRadius: "100%" }}
                                                        src={profile.profileImage || userImage}
                                                        alt="userimg"
                                                        width={100}
                                                        height={100}
                                                    />
                                                    <span style={{ color: "#fff" }}>
                                                        <span style={{ color: "#F9B100" }}>K.</span>
                                                        {profile.firstName}
                                                    </span>
                                                </div>
                                            )}
                                        </LocalUser>
                                        <div className={styles.hostInfoDiv}>
                                            <div className={styles.hostInfo}>
                                                <FiArrowUpLeft className={styles.arrowIcon} />
                                                <div className={styles.hostDetails}>
                                                    <span className={styles.hostName}>{truncateText(profile.firstName)}</span>
                                                    <span className={styles.hostTagLine}>{truncateText(profile.title) || (isHost ? 'Host' : 'Co-Host')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {getFilteredCameraUsers().map((remoteUser) => {
                                        if (remoteUser.audioTrack?.setVolume) {
                                            remoteUser.audioTrack.setVolume(volume);
                                        }
                                        const userInfo = participants.find(p => p.id === remoteUser.uid);
                                        const isRemoteHost = userInfo?.role === 'host';
                                        return (
                                            <div key={remoteUser.uid} className={styles.videoBoxWrapper}>
                                                <RemoteUser
                                                    user={remoteUser}
                                                    playAudio={true}
                                                    playVideo={true}
                                                >
                                                    {!remoteUser.videoTrack?.isPlaying && (
                                                        <div className={styles.streamBoxUserDetails}>
                                                            <Image
                                                                style={{ borderRadius: "100%" }}
                                                                src={userInfo?.picture || userImage}
                                                                alt="userimg"
                                                                width={100}
                                                                height={100}
                                                            />
                                                            <span style={{ color: "#fff" }}>
                                                                <span style={{ color: "#F9B100" }}>K.</span>
                                                                {userInfo?.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </RemoteUser>
                                                <div className={styles.hostInfoDiv}>
                                                    <div className={styles.hostInfo}>
                                                        <FiArrowUpLeft className={styles.arrowIcon} />
                                                        <div className={styles.hostDetails}>
                                                            <span className={styles.hostName}>{truncateText(userInfo?.name)}</span>
                                                            <span className={styles.hostTagLine}>{truncateText(userInfo?.title) || (isRemoteHost ? 'Host' : 'Co-Host')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (isConnected && !canStream) ? (
                                getFilteredCameraUsers().length > 0 ? (
                                    getFilteredCameraUsers().map((remoteUser) => {
                                        if (remoteUser.audioTrack?.setVolume) {
                                            remoteUser.audioTrack.setVolume(volume);
                                        }
                                        const userInfo = participants.find(p => p.id === remoteUser.uid);
                                        const isRemoteHost = userInfo?.role === 'host';
                                        return (
                                            <div key={remoteUser.uid} className={styles.videoBoxWrapper}>
                                                <RemoteUser
                                                    user={remoteUser}
                                                    playAudio={true}
                                                    playVideo={true}
                                                >
                                                    {!remoteUser.videoTrack?.isPlaying && (
                                                        <div className={styles.streamBoxUserDetails}>
                                                            <Image
                                                                style={{ borderRadius: "100%" }}
                                                                src={userInfo?.picture || userImage}
                                                                alt="userimg"
                                                                width={100}
                                                                height={100}
                                                            />
                                                            <span style={{ color: "#fff" }}>
                                                                <span style={{ color: "#F9B100" }}>K.</span>
                                                                {userInfo?.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </RemoteUser>
                                                <div className={styles.hostInfoDiv}>
                                                    <div className={styles.hostInfo}>
                                                        <FiArrowUpLeft className={styles.arrowIcon} />
                                                        <div className={styles.hostDetails}>
                                                            <span className={styles.hostName}>{truncateText(userInfo?.name)}</span>
                                                            <span className={styles.hostTagLine}>{truncateText(userInfo?.title) || (isRemoteHost ? 'Host' : 'Co-Host')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={styles.streamBoxUserDetails}>
                                        <Image
                                            style={{ borderRadius: "100%" }}
                                            src={host.picture || userImage}
                                            alt="userimg"
                                            width={100}
                                            height={100}
                                        />
                                        <span style={{ color: "#fff" }}>Waiting for host...</span>
                                    </div>
                                )
                            ) : (
                                <div className={styles.streamBoxUserDetails}>
                                    <Image
                                        style={{ borderRadius: "100%" }}
                                        src={userImage}
                                        alt="userimg"
                                        width={100}
                                        height={100}
                                    />
                                    <span style={{ color: "#fff" }}>Connecting...</span>
                                </div>
                            )
                        )}

                        {/* {isMobile && isHost && (
                            <div style={{
                                position: 'absolute',
                                bottom: '10%',
                                width: "100%",
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                color: '#fff',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                textAlign: 'center',
                                maxWidth: '80%',
                                display: isScreenSharing ? 'none' : 'block'
                            }}>
                                Screen sharing is available on desktop devices only
                            </div>
                        )} */}

                        <InviteParticipantModal
                            open={showInviteModal}
                            onCancel={() => setShowInviteModal(false)}
                            liveStreamId={liveStreamId}
                            onInvite={inviteParticipant}
                            onRemove={removeParticipant}
                        />
                    </div>
                    <div className={styles.volumeControl}>
                        {canStream && (
                            <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center" }}>
                                {shouldShowMic && typeof micOn !== "undefined" && setMic && (
                                    <div className={styles.actionBtn} onClick={() => setMic((prev) => !prev)}>
                                        {micOn ? <AiOutlineAudio className={clsx(styles.actionIcon, !micOn && styles.activeBtn)} /> : <AiOutlineAudioMuted className={clsx(styles.actionIcon, !micOn && styles.activeBtn)} />}
                                        <span className={clsx(styles.btnLabel, !micOn && styles.activeBtn)}>{micOn ? "Mute" : "Unmute"}</span>
                                    </div>
                                )}
                                {(room.room_type === "soundscape" || room.room_type === "wordflow" || room.room_type === "open_collab") && (isHost && !isScreenSharing) && (
                                    <div className={styles.actionBtn} onClick={() => setShowInviteModal(true)}>
                                        <LuUsers className={styles.actionIcon} />
                                        <span className={styles.btnLabel}>Participants</span>
                                    </div>
                                )}
                                {(!isSoundScape && shouldShowCamera) && typeof cameraOn !== "undefined" && setCamera && (
                                    <div className={styles.actionBtn} onClick={() => setCamera((prev) => !prev)}>
                                        {cameraOn ? <FaVideo className={clsx(styles.actionIcon, !cameraOn && styles.activeBtn)} /> : <FaVideoSlash className={clsx(styles.actionIcon, !cameraOn && styles.activeBtn)} />}
                                        <span className={clsx(styles.btnLabel, !cameraOn && styles.activeBtn)}>{cameraOn ? "Off Camera" : "On Camera"}</span>
                                    </div>
                                )}
                                {isSoundScape && (isHost && !participants.find((p: any) => p.stream_role === 'co-host' && p.invitation_status === 'accepted')) && (
                                    <>
                                        {isScreenSharing ?
                                            (
                                                <div className={`${styles.actionBtn} ${styles.activeBtn}`} onClick={stopScreenShare}>
                                                    <MdStopScreenShare className={styles.actionIcon} />
                                                    <span className={`${styles.btnLabel} ${styles.activeBtn}`}>Stop Share</span>
                                                </div>
                                            )
                                            : (
                                                <div className={styles.actionBtn} onClick={handleScreenShare} title={isMobile ? "Screen sharing available on desktop only" : "Share screen"}>
                                                    <MdAddToQueue className={styles.actionIcon} />
                                                    <span className={styles.btnLabel}>Share Screen</span>
                                                </div>
                                            )}
                                    </>
                                )}
                                {isHost && setCalling && (
                                    <Button
                                        variant='solid'
                                        color='red'
                                        size='small'
                                        style={{ backgroundColor: "red", color: "white" }}
                                        onClick={calling ? () => handleEndStream(liveStreamId) : () => setCalling?.((prev) => !prev)}
                                    // icon={<MdCallEnd />}
                                    >
                                        Leave
                                    </Button>
                                )}
                            </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                                className={styles.videoIcons}
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            >
                                {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
                            </button>
                            <div className={styles.volumeControlContainer} ref={containerRef}>
                                <span className={styles.volumeIcon} onClick={() => setShowVolumeControl((prev) => !prev)}>
                                    <IoMdVolumeHigh />
                                </span>
                                {showVolumeControl && (
                                    <div className={styles.volumeSlider}>
                                        <Slider vertical defaultValue={volume} onChange={(value) => setVolume(value)} tooltip={{ formatter: () => `${volume}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SoundScapeStream