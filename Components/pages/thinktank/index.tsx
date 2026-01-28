import RealtimeProfileMessages from "./real-time-messages";
import { useEffect, useState } from "react";
import { userInterface } from "@/utils/messagetypes";
import { supabase } from "@/config/supabase";

const ThinkTankComponent = () => {
  const [currentUserData, setCurrentUserData] =
    useState<userInterface | null>();

  useEffect(() => {
    fetchUser();
  }, []);
  const fetchUser = async () => {
    const { data: userSession, error: sessionError } =
      await supabase.auth.getUser();

    if (sessionError || !userSession?.user) {
      console.error("Error fetching user session:", sessionError);
      return;
    }
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("oauth_uid, first_name, last_name, user_name, avatar_pic")
      .eq("oauth_uid", userSession.user.id)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user details:", userError);
      return;
    }
    setCurrentUserData(userData ?? null);
  };
  // Fetch full user details from database

  return <RealtimeProfileMessages currentUser={currentUserData || null} />;
};
export default ThinkTankComponent;
