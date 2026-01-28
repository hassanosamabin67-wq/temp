import { supabase } from "@/config/supabase";

export const fetchRoomInvitationData = async (invitationId: string) => {
    const { data: invitation, error: invitationError } = await supabase
        .from("invitation")
        .select("*")
        .eq("id", invitationId)
        .maybeSingle();

    if (invitationError || !invitation) throw new Error("Failed to fetch invitation.");

    const { data: thinktank, error: thinktankError } = await supabase
        .from("thinktank")
        .select("title")
        .eq("id", invitation.action)
        .maybeSingle();

    if (thinktankError) throw new Error("Failed to fetch thinktank.");

    const { data: sender, error: senderError } = await supabase
        .from("users")
        .select("firstName, lastName, email")
        .eq("userId", invitation.sender)
        .maybeSingle();

    if (senderError) throw new Error("Failed to fetch sender.");

    const { data: receiver, error: receiverError } = await supabase
        .from("users")
        .select("firstName, lastName, email")
        .eq("userId", invitation.receiver_id)
        .maybeSingle();

    if (receiverError) throw new Error("Failed to fetch receiver.");

    return {
        invitation,
        thinktank,
        sender,
        receiver
    };
};