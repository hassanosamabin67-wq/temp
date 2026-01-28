import { useEffect, useState } from "react";
import AgoraRTC, { useJoin, usePublish, useLocalMicrophoneTrack, useLocalCameraTrack, useRemoteUsers, IAgoraRTCClient } from "agora-rtc-react";

export const useAgoraLiveRole = ({
  client,
  isHost,
  isCoHost,
  appId,
  channel,
  token,
  uid,
  calling,
  micOn,
  cameraOn
}: {
  client: any;
  isHost: boolean;
  isCoHost?: boolean;
  appId: string;
  channel: string;
  token: string | null;
  uid: string;
  calling: boolean;
  micOn: boolean;
  cameraOn: boolean;
}) => {
  const canStream = isHost || isCoHost;
  const [isRoleUpdated, setIsRoleUpdated] = useState(false);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(canStream && micOn);
  const { localCameraTrack } = useLocalCameraTrack(canStream && cameraOn);
  const remoteUsers = useRemoteUsers();
  const [screenTrack, setScreenTrack] = useState<any>(null);
  const [screenClient, setScreenClient] = useState<IAgoraRTCClient | null>(null);
  const [screenShareInfo, setScreenShareInfo] = useState<string | null>(null);

  const startScreenShare = async () => {
    try {
      // Check if on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        console.warn("Screen sharing is not supported on mobile devices");
        return;
      }

      const screenTracks = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail"
      });

      const videoTrack = Array.isArray(screenTracks) ? screenTracks[0] : screenTracks;
      const tracksToPublish = Array.isArray(screenTracks) ? screenTracks : [screenTracks];

      // Try to get screen share label/name
      try {
        const label = videoTrack.getMediaStreamTrack()?.label || 'Screen';
        setScreenShareInfo(label);
      } catch (e) {
        setScreenShareInfo('Screen');
      }

      const newScreenClient = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      await newScreenClient.setClientRole("host");

      const screenUid = `${uid}_screen`;

      await newScreenClient.join(appId, channel, token, screenUid);

      await newScreenClient.publish(tracksToPublish);

      setScreenTrack(videoTrack);
      setScreenClient(newScreenClient);

      videoTrack.on("track-ended", () => {
        stopScreenShare();
      });

    } catch (error) {
      console.error("Error starting screen share:", error);
      setScreenShareInfo(null);
    }
  };

  const stopScreenShare = async () => {
    try {
      if (screenClient) {
        try {
          await screenClient.unpublish();
          await screenClient.leave();
        } catch (e) {
          console.warn("Failed to unpublish/leave screen client", e);
        }
      }

      if (screenTrack) {
        try {
          screenTrack.stop();
          screenTrack.close();
        } catch (e) {
          console.warn("Failed to stop/close screen track", e);
        }
      }

      setScreenTrack(null);
      setScreenClient(null);
      setScreenShareInfo(null);
    } catch (error) {
      console.error("Unexpected error while stopping screen sharing:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (screenTrack || screenClient) {
        stopScreenShare();
      }
    };
  }, []);

  useEffect(() => {
    if (!client) return;

    const updateRole = async () => {
      try {
        const newRole = canStream ? "host" : "audience";
        const currentRole = client.role;

        if (currentRole !== newRole) {
          console.log(`Changing role from ${currentRole} to ${newRole}`);
          await client.setClientRole(newRole);
          setIsRoleUpdated(true);
          console.log(`Client role successfully set to: ${newRole}`);
        } else {
          setIsRoleUpdated(true);
        }
      } catch (error) {
        console.error("Error setting client role:", error);
      }
    };

    updateRole();
  }, [client, canStream]);

  useJoin({ appid: appId, channel, token, uid }, calling);

  const tracksToPublish: any[] = [];

  if (canStream && calling && isRoleUpdated) {
    if (localMicrophoneTrack && micOn) {
      tracksToPublish.push(localMicrophoneTrack);
    }
    if (localCameraTrack && cameraOn) {
      tracksToPublish.push(localCameraTrack);
    }
  }

  usePublish(tracksToPublish);

  return {
    localMicrophoneTrack: canStream ? localMicrophoneTrack : null,
    localCameraTrack: canStream ? localCameraTrack : null,
    remoteUsers,
    startScreenShare,
    stopScreenShare,
    screenTrack,
    setScreenTrack,
    screenShareInfo
  };
};