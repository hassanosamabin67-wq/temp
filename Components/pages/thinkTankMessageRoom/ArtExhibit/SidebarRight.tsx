'use client'
import React, { useEffect, useState } from 'react';
import ArtistInfo from './ArtistInfo';
import ChatQnA from './ChatQnA';
import GalleryStats from './GalleryStats';
import CommentaryPlayer from './CommentaryPlayer';
import { Button } from 'antd';
import { supabase } from '@/config/supabase';

const SidebarRight = ({ roomId, hostId, artwork, artistInfo, isHost }: any) => {
  const [muteChat, setMuteChat] = useState(false);

  const handleMuteChats = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from("art_exhibit_room")
        .update({ is_chat_muted: !muteChat })
        .eq("room_id", roomId);

      if (error) {
        console.error("Error Muting Chats: ", error);
        return;
      }

      setMuteChat((prevMuteState) => !prevMuteState);

    } catch (err) {
      console.error("Unexpected Error in muting chats: ", err);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('realtime-chat-control')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'art_exhibit_room',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload?.new.is_chat_muted !== undefined) {
            setMuteChat(payload.new.is_chat_muted);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <div className='sidebar-right'>
      <ArtistInfo roomId={roomId} hostId={hostId} artistInfo={artistInfo} />
      {/* <CommentaryPlayer artwork={artwork} /> */}
      {isHost && (<Button onClick={() => handleMuteChats(roomId)}>Turn On/Off Chat</Button>)}
      {!muteChat && (<ChatQnA roomId={roomId} hostId={hostId} />)}
      {isHost && (<GalleryStats hostId={hostId} artwork={artwork} roomId={roomId} />)}
    </div>
  );
};

export default SidebarRight; 