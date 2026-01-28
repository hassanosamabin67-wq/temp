import { useNotification } from "@/Components/custom/custom-notification";
import { supabase } from "@/config/supabase";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthData } from "@/store/slices/auth-slice";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function UseVisionaryProfileEdit() {
  const { notify } = useNotification();
  const dispatch = useAppDispatch();
  const searchParam = useSearchParams();
  const visionary: string | null = searchParam.get("visionary");
  const profileRedux = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState(profileRedux);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(false)

  useEffect(() => {
    if (visionary) {
      fetchVisionaries();
    } else {
      setProfile(profileRedux); // Reset profile if no visionary is provided
    }
  }, [visionary, profileRedux]);

  const fetchVisionaries = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("profileId", visionary)
        .single();
      if (error) {
        console.error("Error fetching visionary:", error);
        return;
      }

      if (data) {
        setProfile(data as any);
        setOnlineStatus(data.is_online)
      }
    } catch (err) {
      console.error("Unexpected error fetching visionary:", err);
    }
  };
  const [profileFirstName, setProfileFirstName] = useState(profile.firstName);
  const [profileLastName, setProfileLastName] = useState(profile.lastName);
  const [profileUserName, setProfileUserName] = useState(profile.userName);
  const [editProfileName, setEditProfileName] = useState(false);
  const [editProfileImage, setEditProfileImage] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState(profile.companyName);
  const [editOverview, setEditOverview] = useState(profile.overview);
  const [editCountry, setEditCountry] = useState(profile.country);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>();

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isEditOverviewOpen, setIsEditOverviewOpen] = useState(false);

  const handleImageChange = async (url: string) => {
    try {
      setUploadedImage(url);
      setProfile((prev: any) => ({ ...prev, profileImage: url }));
      dispatch(setAuthData({ ...profile, profileImage: url }));
      const { error } = await supabase
        .from("users")
        .update({ profileImage: url })
        .eq("userId", profile.profileId);

      if (error) {
        notify({ type: "error", message: "Failed to update profile image" });
      } else {
        notify({ type: "success", message: "Profile image updated" });
      }
    } catch (e) {
      notify({ type: "error", message: "Unexpected error updating image" });
    }
  };

  const editName = () => setEditProfileName(true);
  const editCompany = () => setIsCompanyModalOpen(true);
  const editCountryModal = () => setIsCountryModalOpen(true);
  const editOverviewModal = () => setIsEditOverviewOpen(true);

  const saveProfileName = async () => {
    setEditProfileName(false);
    dispatch(setAuthData({ ...profile, firstName: profileFirstName, lastName: profileLastName, userName: profileUserName }));

    const { error } = await supabase
      .from("users")
      .update({ firstName: profileFirstName, lastName: profileLastName, userName: profileUserName })
      .eq("userId", profile.profileId);

    if (error) notify({ type: "error", message: "Failed to update name" });
  };

  const saveCompany = async () => {
    setIsCompanyModalOpen(false);
    dispatch(setAuthData({ ...profile, companyName: editCompanyName, overview: editOverview }));

    const { error } = await supabase
      .from("users")
      .update({ companyName: editCompanyName, overview: editOverview })
      .eq("userId", profile.profileId);

    if (error) notify({ type: "error", message: "Failed to update company details" });
  };

  const saveCountry = async () => {
    setIsCountryModalOpen(false);
    dispatch(setAuthData({ ...profile, country: editCountry }));

    const { error } = await supabase
      .from("users")
      .update({ country: editCountry })
      .eq("userId", profile.profileId);

    if (error) notify({ type: "error", message: "Failed to update country" });
  };

  return {
    editName,
    saveProfileName,
    editProfileName,
    setProfileFirstName,
    setProfileLastName,
    setProfileUserName,

    editCompany,
    saveCompany,
    isCompanyModalOpen,
    setEditCompanyName,
    setEditOverview,
    editCountryModal,
    editCountry,
    saveCountry,
    isCountryModalOpen,
    setEditCountry,

    editOverview,
    isEditOverviewOpen,
    setIsEditOverviewOpen,

    uploadedImage,
    handleImageChange,
    editProfileImage,
    setEditProfileImage,
    editOverviewModal,
    profile,
    onlineStatus,
    setOnlineStatus
  };
}

export default UseVisionaryProfileEdit;
