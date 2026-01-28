// pages/index.js
import { useEffect, useState } from "react";
import { Upload, Button, message } from "antd";
import { supabase } from "@/config/supabase";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthData } from "@/store/slices/auth-slice";
import { useNotification } from "@/Components/custom/custom-notification";

export default function ProfileVideo({
  profileVideoUrl,
  setProfileVideoUrl,
}: any) {
  const profile = useAppSelector((state) => state.auth);
  // const [] = useState("")
  // useEffect(()=>{
  //   const url =  profile.video
  //   ? profile.video
  //   : "https://www.w3schools.com/html/mov_bbb.mp4"
  //   setProfileVideoUrl(url)
  // }, [profile.video])
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = useState(false);
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const beforeUpload = (file: any) => {
    if (file.size > MAX_SIZE) {
      message.error("Video must be smaller than 50MB.");
      return Upload.LIST_IGNORE; // Prevents the file from being added to the upload list
    }
    return true;
  };
  const { notify } = useNotification();
  // Custom upload handler that uses Supabase Storage
  const handleUpload = async ({ file }: any) => {
    setUploading(true);
    const filePath = `${profile.profileId}/${file.name
      }/${new Date().toISOString()}`; // Adjust this path as needed

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from("profile")
      .upload(filePath, file);

    setUploading(false);
    if (error) {
      console.error("Error uploading file:", error);
      message.error("Upload failed: " + error.message);
    } else {
      const publicUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL +
        "/storage/v1/object/public/" +
        `profile/` +
        data.path;
      console.log(publicUrl, "pubb");

      setProfileVideoUrl(publicUrl);
      // dispatch(setAuthData({ ...profile, video: publicUrl }));
      console.log("File uploaded successfully:", data);
      notify({
        type: "success",
        message: "Upload successful!",
      });
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Introductory Video</h2>

        <Upload
          accept="video/*"
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={handleUpload} // Use our custom upload function
        >
          <Button type="primary" loading={uploading}>
            {uploading ? "Uploading..." : "Upload Video"}
          </Button>
        </Upload>
      </div>
      {profileVideoUrl && (
        <video controls width="300" style={{ margin: "20px 0" }}>
          <source src={profileVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
