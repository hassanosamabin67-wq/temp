"use client";

import { useEffect, useState } from "react";
import {
  conversationInterface,
  RealTimeProfileMessages,
} from "@/utils/messagetypes";
import { useSearchParams } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import { supabase } from "@/config/supabase";
import RecentChats from "../recent-chats";
import ChatRoom from "../chatroom";

const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
};

// Correct naming: `isMobile` is true when width is LESS than 768px
function useIsMobile() {
  return !useMediaQuery({ query: breakpoints.md });
}

const RealtimeProfileMessages = ({ currentUser }: RealTimeProfileMessages) => {
  const [conversations, setConversations] = useState<conversationInterface[]>(
    []
  );
  const [showRoom, setShowRoom] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState({});
  const [conversationId, setConversationId] = useState<string>("");
  const searchParam = useSearchParams();

  const isMobile = useIsMobile();

  // Fetch conversations
  useEffect(() => {
    if (!currentUser) return;

    const activeConversation: string | null =
      searchParam.get("conversationId");
    setConversationId(activeConversation ?? "");

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, user1_id, user2_id")
        .or(
          `user1_id.eq.${currentUser?.oauth_uid},user2_id.eq.${currentUser?.oauth_uid}`
        );

      if (error) {
        console.error("Error fetching conversations:", error);
      } else {
        setConversations((data as conversationInterface[]) ?? []);
      }
    };

    fetchConversations();

    const conversationSubscription = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload: { new: conversationInterface }) => {
          const newConversation: conversationInterface = payload.new;
          if (
            newConversation.user1_id === currentUser.oauth_uid ||
            newConversation.user2_id === currentUser.oauth_uid
          ) {
            setConversations((prev) => [...prev, newConversation]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationSubscription);
    };
  }, [currentUser]);

  // Fetch user details
  useEffect(() => {
    if (conversations.length === 0) return;

    const fetchRecipients = async () => {
      const recipientIds = conversations.map((conv) =>
        conv.user1_id === currentUser?.oauth_uid
          ? conv.user2_id
          : conv.user1_id
      );

      if (recipientIds.length === 0) return;

      const { data: users, error } = await supabase
        .from("users")
        .select("oauth_uid, user_name, user_email, avatar_pic, country")
        .in("oauth_uid", recipientIds);

      if (error) {
        console.error("Error fetching user details:", error);
        return;
      }

      const userMap: any = {};
      users.forEach((user) => {
        userMap[user?.oauth_uid] = user;
      });

      setUserDetails(userMap);
    };

    fetchRecipients();
  }, [conversations, currentUser]);

  return (
    <div className="p-4">

      {/* Desktop view */}
      {!isMobile && (
        <div className="flex">
          <div className="w-2/5 border-r p-4 overflow-y-auto h-[70vh]">
            <h2 className="mt-6 text-lg font-semibold">Recent Chats</h2>
            <RecentChats
              conversations={conversations}
              currentUser={currentUser}
              userDetails={userDetails}
              setConversationId={(id) => {
                setConversationId(id);
                setShowRoom(true);
              }}
              conversationId={conversationId}
              setShowRoom={setShowRoom}
            />
          </div>

          <div className="w-3/5 p-4">
            {conversationId && (
              <ChatRoom
                showRoom={true}
                currentUser={currentUser?.oauth_uid}
                conversationId={conversationId}
                userDetails={userDetails}
                setShowRoom={setShowRoom}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile view */}
      {isMobile && (
        <div className="w-full p-4">
          {!showRoom ? (
            <div className="overflow-y-auto h-full">
              <h2 className="mt-6 text-lg font-semibold">Recent Chats</h2>
              <RecentChats
                conversations={conversations}
                currentUser={currentUser}
                userDetails={userDetails}
                setConversationId={(id) => {
                  setConversationId(id);
                  setShowRoom(true);
                }}
                conversationId={conversationId}
                setShowRoom={setShowRoom}
              />
            </div>
          ) : (
            <ChatRoom
              showRoom={true}
              currentUser={currentUser?.oauth_uid}
              conversationId={conversationId}
              userDetails={userDetails}
              setShowRoom={setShowRoom}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeProfileMessages;
