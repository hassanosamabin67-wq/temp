'use client'
import React, { useState } from 'react'
import { Input } from 'antd'
import { supabase } from '@/config/supabase'
import { useAppSelector } from '@/store'
import { IoSend } from 'react-icons/io5'
import useLiveStreamData from '@/hooks/liveStream/useLiveStreamData'
import Tab from './Tab'
import Controls from '@/Components/custom/video-call-controls'
import useMediaControls from '@/hooks/calling/useMediaControl'
import { useJoinChannel } from '@/hooks/calling/useJoinChannel'
import { LocalUser, RemoteUser, useIsConnected } from 'agora-rtc-react'
import Image from 'next/image'
import userImage from '@/public/assets/img/userImg.webp'
import { useAgoraLiveRole } from '@/hooks/liveStream/useAgoraLiveRole'

const LiveStream = ({ streamId, client }: any) => {
    const profile = useAppSelector((state) => state.auth);
    const thinkTankId = streamId[0];
    const stream = streamId[1];
    const [message, setMessage] = useState('');
    const isConnected = useIsConnected();
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const { micOn, setMic, cameraOn, setCamera } = useMediaControls(true, true);
    const { participants, host } = useLiveStreamData(stream, profile);
    const [messages, setMessages] = useState([])
    const isHost = host.id === profile.profileId;
    const uid = isHost && host.id ? host.id : profile.profileId!;
    const { rtcToken, currentLiveStatus, calling, setCalling, setCurrentLiveStatus } = useJoinChannel("/api/rtc-token", stream, "live_stream", isHost, undefined, "liveStream");

    const { localMicrophoneTrack, localCameraTrack, remoteUsers } = useAgoraLiveRole({ client, isHost, appId, channel: stream, token: rtcToken, uid, calling, micOn, cameraOn });

    React.useEffect(() => {
        if (!isHost && isConnected) {
            // Request audio permissions for audience to hear host
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log("Audio permissions granted for audience");
                    // Initialize audio context to ensure audio can be played
                    if (typeof window !== 'undefined' && !window.AudioContext) {
                        console.log("Audio context not available");
                    } else {
                        console.log("Audio context available");
                    }
                })
                .catch((error) => {
                    console.error("Audio permissions denied for audience:", error);
                });
        }
    }, [isHost, isConnected]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;

        const user = participants.find((p) => p.id === profile.profileId);
        const userName = user?.name || 'Unknown';

        const newMessage = {
            id: profile.profileId,
            userName,
            text: messageText,
            profileImg: profile.profileImage
        };

        const { data, error: fetchError } = await supabase
            .from("live_stream")
            .select("messages")
            .eq("id", stream)
            .single();

        if (fetchError) {
            console.error("Error fetching messages:", fetchError);
            return;
        }

        const currentMessages = data?.messages || [];
        const updatedMessages = [...currentMessages, newMessage];

        const { error: updateError } = await supabase
            .from("live_stream")
            .update({ messages: updatedMessages })
            .eq("id", stream);

        if (updateError) {
            console.error('Message send failed:', updateError);
        } else {
            setMessage('');
        }
    };

    return (
        <div className='live-stream-main'>
            <div className='stream-container'>
                <div className='stream-box'>
                    {isConnected && isHost ? (
                        <LocalUser
                            audioTrack={localMicrophoneTrack}
                            cameraOn={cameraOn}
                            micOn={micOn}
                            playAudio={false}
                            videoTrack={localCameraTrack}
                            className="call-div"
                        >
                            {!cameraOn && (
                                <div className="call-user-div">
                                    <Image style={{ borderRadius: "100%" }} src={profile.profileImage || userImage} alt="userimg" width={100} height={100} />
                                    <span style={{ color: "#fff" }}>{profile.firstName}</span>
                                </div>
                            )}
                        </LocalUser>
                    ) : isConnected && !isHost ? (
                        remoteUsers.length > 0 ? (
                            remoteUsers
                                .filter(user => user.uid === host.id)
                                .map((remoteUser) => (
                                    <RemoteUser
                                        key={remoteUser.uid}
                                        user={remoteUser}
                                        className='call-div'
                                        playAudio={true}
                                        playVideo={true}
                                    >
                                        {!remoteUser.videoTrack?.isPlaying && (
                                            <div className="call-user-div">
                                                <Image style={{ borderRadius: "100%" }} src={host.picture || userImage} alt="userimg" width={100} height={100} />
                                                <span style={{ color: "#fff" }}>{host.name}</span>
                                            </div>
                                        )}
                                    </RemoteUser>
                                ))
                        ) : (
                            <div className="call-div">
                                <div className="call-user-div">
                                    <Image style={{ borderRadius: "100%" }} src={host.picture || userImage} alt="userimg" width={100} height={100} />
                                    <span style={{ color: "#fff" }}>Waiting for host...</span>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="call-div">
                            <div className="call-user-div">
                                <Image style={{ borderRadius: "100%" }} src={userImage} alt="userimg" width={100} height={100} />
                                <span style={{ color: "#fff" }}>Connecting...</span>
                            </div>
                        </div>
                    )}
                </div>
                {isHost && (
                    <Controls
                        micOn={micOn}
                        setMic={setMic}
                        cameraOn={cameraOn}
                        setCamera={setCamera}
                        calling={calling}
                        handleEndCall={() => console.log("End Call")}
                    />
                )}
            </div>
            <div className='chat-box'>
                <div className='lv-messages'>
                    <Tab messages={messages} participants={participants} />
                </div>
                <div className='input-box'>
                    <Input className='message-input' placeholder='Message' suffix={<span onClick={() => sendMessage(message)}><IoSend /></span>} value={message} onChange={(e) => setMessage(e.target.value)} onPressEnter={() => sendMessage(message)} />
                </div>
            </div>
        </div>
    )
}

export default LiveStream