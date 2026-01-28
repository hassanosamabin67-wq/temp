"use client";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import './style.css';
import LiveStream from "./index";
import SoundScapeStream from "../thinkTankMessageRoom/SoundScapeStream";
import { Spin } from "antd";

const ProviderStream = ({ startingLiveStream, liveStreamId, roomId, room }: { startingLiveStream: boolean, liveStreamId: string, roomId: string, room: any }) => {
    const client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
        role: "audience" // Default role, will be changed in the hook
    });

    if (startingLiveStream) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", backgroundColor: "white" }}>
                <Spin size="large" children="Starting Live Stream..." />
            </div>
        )
    }

    return (
        <AgoraRTCProvider client={client}>
            {/* <LiveStream streamId={streamId} client={client} /> */}
            <SoundScapeStream client={client} liveStreamId={liveStreamId} roomId={roomId} room={room} />
        </AgoraRTCProvider>
    );
};

export default ProviderStream;