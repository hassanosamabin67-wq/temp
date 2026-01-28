import React, { useState, useEffect } from "react";
import { Upload } from "antd";
import type { UploadProps } from "antd";
import ImgCrop from "antd-img-crop";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { supabase } from "@/config/supabase";
import SupabaseuploadImage from "@/utils/supabase-image-upload";
import { useAppSelector, useAppDispatch } from "@/store";
import { setAuthData } from "@/store/slices/auth-slice";
import { useNotification } from "@/Components/custom/custom-notification";

type UploadPicProps = {
  onImageChange: (url: string) => void;
  initialImage?: string;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_MB = 2;

const UploadPic: React.FC<UploadPicProps> = ({ onImageChange, initialImage }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImage);
  const profile = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { notify } = useNotification();

  useEffect(() => setImageUrl(initialImage), [initialImage]);

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const typeOk = ALLOWED_TYPES.includes(file.type);
    if (!typeOk) {
      notify({ type: "error", message: "You can only upload JPG/PNG files!" });
      return Upload.LIST_IGNORE;
    }
    const sizeOk = (file.size ?? 0) / 1024 / 1024 < MAX_MB;
    if (!sizeOk) {
      notify({ type: "error", message: `Image must be smaller than ${MAX_MB}MB!` });
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const beforeCrop = (file: File) => {
    const ok = ALLOWED_TYPES.includes(file.type) && (file.size ?? 0) / 1024 / 1024 < MAX_MB;
    if (!ok) notify({ type: "error", message: "Only JPG/PNG under 2MB allowed." });
    return ok;
  };

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onError, onSuccess } = options as any;

    if (!ALLOWED_TYPES.includes(file.type) || (file.size ?? 0) / 1024 / 1024 >= MAX_MB) {
      onError?.(new Error("Invalid file"));
      return;
    }

    try {
      setLoading(true);
      const data = await SupabaseuploadImage(file as File, profile.profileId!);
      const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/profile/" + data?.path;
      setImageUrl(publicUrl);
      dispatch(setAuthData({ ...profile, profileImage: publicUrl }));
      onImageChange(publicUrl);
      onSuccess?.({ url: publicUrl });
    } catch (e) {
      notify({ type: "error", message: "Upload failed" });
      onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <ImgCrop beforeCrop={beforeCrop}>
      <div style={{ display: "flex", alignItems: "center", gap: "100px" }}>
        <Upload
          name="avatar"
          listType="picture-circle"
          className="avatar-uploader"
          showUploadList={false}
          accept="image/jpeg,image/png"
          multiple={false}
          maxCount={1}
          beforeUpload={beforeUpload}
          customRequest={customRequest}
        >
          {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: "100%" }} /> : uploadButton}
        </Upload>

        <div className="profilePicInstructions">
          <ul className="profilePicInstructionList">
            <li className="listProfilePic">Use white or plain background</li>
            <li className="listProfilePic">Face the camera</li>
            <li className="listProfilePic">A smile helps 🙂</li>
            <li className="listProfilePic">Formal picture is a plus</li>
          </ul>
        </div>
      </div>
    </ImgCrop>
  );
};

export default UploadPic;