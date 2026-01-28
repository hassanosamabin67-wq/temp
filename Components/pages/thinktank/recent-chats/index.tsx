import { conversationInterface, userInterface } from "@/utils/messagetypes";
import { useRouter } from "next/navigation";
import React from "react";

interface RecentChatsInterface {
  conversations: conversationInterface[];
  currentUser: userInterface | null;
  userDetails: any;
  setConversationId: React.Dispatch<React.SetStateAction<string>>;
  setShowRoom: React.Dispatch<React.SetStateAction<boolean>>;
  conversationId: string;

}

function RecentChats({
  conversations,
  currentUser,
  userDetails,
  setConversationId,
  conversationId,
  setShowRoom
}: RecentChatsInterface) {
  const router = useRouter();

  return (
    <ul className="mt-4">
      {conversations.length > 0 ? (
        conversations.map((conv: conversationInterface) => {
          const otherUserId =
            conv.user1_id === currentUser?.oauth_uid
              ? conv.user2_id
              : conv.user1_id;
          const otherUser = userDetails[otherUserId];

          return (
            <li
              key={conv.id}
              className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer ${
                conv.id === conversationId
                  ? "bg-[#fde047] text-black"
                  : "hover:bg-gray-200 mb-2"
              }`}
              onClick={() => {
                setConversationId(conv.id);
                setShowRoom(true)
                router.replace(
                  `/profile?tab=messages&conversationId=${conv.id}`
                );
                router.refresh();
              }}
            >
              {/* Avatar */}
              {otherUser?.avatar_pic ? (
                <img
                  src={otherUser.avatar_pic}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  👤
                </div>
              )}
              <div className="flex flex-col">
                {/* Username with truncate for mobile */}
                <p className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                  {otherUser ? otherUser.user_name : "Unknown User"}
                </p>
                <p className="text-gray-500 text-sm">
                  {otherUser?.country || "No country"}
                </p>
              </div>
            </li>
          );
        })
      ) : (
        <p className="text-gray-500">No conversations yet.</p>
      )}
    </ul>
  );
}

export default RecentChats;
