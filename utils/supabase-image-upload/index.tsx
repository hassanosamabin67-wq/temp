import { supabase } from "@/config/supabase";

export default async function SupabaseuploadImage(file: File, profileId: string) {
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const filePath = `${encodeURIComponent(profileId)}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("profile")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (error) throw error;
  return data;
}