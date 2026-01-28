"use client";
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
import VideoCallLayout from "./VideoCallLayout";
import './style.css'

const VideoCalling = ({ channelName }: { channelName: any }) => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    return (
        <AgoraRTCProvider client={client}>
            <VideoCallLayout channelName={channelName} />
        </AgoraRTCProvider>
    );
};

export default VideoCalling;


// import { useCallTimer } from "@/hooks/videoCall/useCallTimer";
// import { useLiveSession } from "@/hooks/videoCall/useLiveSession";
// import { useParticipants } from "@/hooks/videoCall/useParticipants";
// import { useScreenShare } from "@/hooks/videoCall/useScreenShare";
// import VideoCallLayout from "./VideoCallLayout";
// import FloatingStats from "./FloatingStats";
// import VideoCallControls from "./VideoCallControls";
// import ReviewModal from "./ReviewModal";
// import { useAppSelector } from "@/store";

// const VideoCalling = ({ channelName }: any) => {
//   const profile = useAppSelector(state => state.auth);
//   const channel = channelName[1];
//   const { host, participants } = useParticipants(channel, profile);
//   const { screenSharing, start, stop } = useScreenShare(
//     process.env.NEXT_PUBLIC_AGORA_APP_ID!,
//     channel,
//     null
//   );

//   const handleCallEnd = () => {
//     console.log("Call ended logic triggered");
//   };

//   const { timeLeft } = useCallTimer(true, true, handleCallEnd);
//   const { status } = useLiveSession(channel, handleCallEnd);

//   return (
//     <div className="video-parent">
//       <VideoCallLayout
//         screenSharing={screenSharing}
//         participants={participants}
//         profile={profile}
//       />
//       <FloatingStats timeLeft={timeLeft} participantCount={participants.length} />
//       <VideoCallControls
//         onEndCall={handleCallEnd}
//         screenSharing={screenSharing}
//         toggleScreenShare={() => (screenSharing ? stop() : start())}
//       />
//       <ReviewModal visible={status === "end"} />
//     </div>
//   );
// };

// export default VideoCalling;