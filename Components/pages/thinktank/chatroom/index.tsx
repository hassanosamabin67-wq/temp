import { SetStateAction, useEffect, useRef, useState } from "react";
// import { supabase } from "@/lib/supabase";
import moment from "moment";
import { IoArrowBackOutline } from "react-icons/io5";
import { BsSendArrowUp } from "react-icons/bs";
import { useMediaQuery } from 'react-responsive';
import MessageTimestamp from "./msg-time";
import { Spin } from "antd";
import { supabase } from "@/config/supabase";
interface ChatRoomInterface {
  userDetails: any;
  conversationId: string;
  showRoom: boolean;
  currentUser: string |undefined;
  setShowRoom: React.Dispatch<React.SetStateAction<boolean>>;
}
interface MessageInterface {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string |null;
}
interface receiverDetails {
  avatar_pic:string;
  user_name:string;
  country:string
}

const ChatRoom = ({
  conversationId,
  setShowRoom,
  userDetails,
  currentUser,
  showRoom
}: ChatRoomInterface) => {
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverId, setReceiverId] = useState(null);
  const [receiverDetails, setReceiverDetails] = useState<receiverDetails>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  
  useEffect(() => {
    // Scroll to the bottom every time the messages change
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    userDetails &&
      Object.keys(userDetails).filter((key: any) => {
        return key == receiverId ? setReceiverDetails(userDetails[key]) : "";
      });
  },[userDetails,receiverId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setMessages(data);
  };
  useEffect(() => {
    // if (!conversationId || !currentUser) return;
    fetchMessages();
    // Subscribe to real-time messages
    const subscription = supabase
      .channel(`chat-${conversationId}`) // ✅ Fix template string syntax
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.conversation_id === conversationId) {
            setMessages((prev: any) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId, currentUser,receiverId,showRoom]);

  // Fetch receiver user ID
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const fetchConversation = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .single();

      if (error) {
        console.error("Error fetching conversation:", error);
      } else {
        // Set the receiver ID (the other participant)
        setReceiverId(
          data.user1_id === currentUser ? data.user2_id : data.user1_id
        );
      }
    };

    fetchConversation();
  }, [conversationId, currentUser]);

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!currentUser || !receiverId) return;

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: currentUser,
        receiver_id: receiverId,
        message: newMessage,
      },
    ]);

    if (!error) setNewMessage("");
  };
console.log(receiverDetails,userDetails,"receiverDetails");

  return (
    <div className="p-4 border rounded-lg shadow-md w-full h-full md:max-w-md sm:max-w-full max-w-full mx-auto  flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span
          onClick={() => setShowRoom(false)}
          className="cursor-pointer xl:hidden lg:hidden md:hidden block bg-[#fde047] p-[8px] rounded-full mr-[5px]"
        >
          <IoArrowBackOutline size={22} />
        </span>
        {receiverDetails ? (
          <div className=" profile_info flex gap-[8px] items-center">
            <div className="profile_img">
              <img
                src={receiverDetails?.avatar_pic}
                className={`w-[40px] ${
                  receiverDetails ? "block" : "hidden"
                } h-[40px] rounded-full`}
                alt="Profile Image"
              />
            </div>
            <div className="profile_name flex flex-col gap-[3px]">
              <h1 className="text-xl font-bold leading-[1] text-[18px]">
                {receiverDetails?.user_name}
              </h1>
              <p className="country leading-[1] text-[14px]">
                {receiverDetails?.country}
              </p>
            </div>
          </div>
        ) : (
          <Spin
            className={
              "!w-[40px] !h-[40px]  xl:hidden lg:hidden md:hidden block"
            }
            />
        )}
       
      </div>

      {/* Messages List */}
      <div className="xl:flex-1 lg:flex-1 md:flex-1 overflow-y-auto xl:h-full lg:h-full md:h-full h-[400px] xl:max-h-[60vh] lg:max-h-[60vh] md:max-h-[60vh] max-h-[400px] mb-2 border p-2 rounded flex flex-col gap-2">
        {messages.map((msg: MessageInterface) => {
          const isSender = msg.sender_id === currentUser;
          return (
            <div
              key={msg.id}
              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-full p-2 rounded-lg shadow-md ${
                  isSender
                    ? "bg-[#fde047] text-black rounded-br-none"
                    : "bg-gray-200 text-black rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>{" "}
                {/* Ensure text breaks and wraps */}
                <MessageTimestamp createdAt={msg.created_at ??null} />
              </div>
            </div>
          );
        })}
                <div ref={messagesEndRef} />

      </div>

      {/* Message Input */}
      <div className="flex">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 w-full p-2 border rounded"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newMessage.trim() !== "") {
              sendMessage(); // Send message on Enter key press
              // e.preventDefault(); // Prevent default form submission behavior
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="ml-2 xl:block lg:block md:block hidden bg-[#fde047] text-black font-medium p-2 px-5 rounded"
        >
          Send
        </button>

        <button
          onClick={sendMessage}
          className="ml-2 bg-[#fde047] xl:hidden lg:hidden md:hidden block text-black px-[15px] py-[15px] rounded"
        >
          <BsSendArrowUp />
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
