import { Image, Tag } from "antd";
import React from "react";
import { EditFilled } from "@ant-design/icons";
import { IoLocationSharp } from "react-icons/io5";
import { useSearchParams } from "next/navigation";

interface DashboardHeaderProps {
  profile: {
    profileImage: string;
    firstName: string;
    lastName: string;
    userName?: string;
    country: string;
    companyName?: string;
    overview?: string;
    profileType?: string;
    title?: string;
    profileId?: string
  };
  loggedInProfileType: string;
  imageEdit: () => any;
  nameEdit: () => any;
  countryEdit: () => any;
  descEdit: () => any;
  isOnline: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  profile,
  loggedInProfileType,
  imageEdit,
  nameEdit,
  countryEdit,
  descEdit,
  isOnline
}) => {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('visionary');

  const isOwner = keyword ? profile.profileId !== keyword : loggedInProfileType === profile.profileType;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div className="info-part">
        <div className="leftContProfilePage">
          <div className="profile-image-edit">
            <Image
              className="profileimg"
              src={profile.profileImage}
              height={100}
              width={100}
            />
            {isOwner && (
              <span className="edit-btn" onClick={imageEdit}>
                <EditFilled />
              </span>
            )}
          </div>

          <div>
            <div className="profile-name">
              {isOwner && profile.firstName + " " + profile.lastName}
              {!isOwner && profile.userName}
            </div>
            {profile.title && <span className="profile-title">{profile.title}</span>}

            {isOwner && (
              <div className="user-name-div">
                {profile.userName && <span className="profile-username">{profile.userName}</span>}
                <span className="edit-btn" onClick={nameEdit}>
                  <EditFilled />
                </span>
              </div>
            )}

            <div className="online-location-div">
              <div className="profile-location">
                <IoLocationSharp style={{ margin: "0 3px 0 0" }} /> {profile.country}
                {isOwner && (
                  <span className="edit-btn" onClick={countryEdit}>
                    <EditFilled />
                  </span>
                )}
              </div>
            </div>
            {isOnline ? (
              <div className="profile-online-tag">
                <Tag color="success">Online</Tag>
              </div>
            ) : (
              <div className="profile-online-tag">
                <Tag color="default">Offline</Tag>
              </div>
            )}
          </div>
        </div>
      </div>

      {profile.companyName && (
        <h2 className="company-name">
          {profile.companyName}
          {isOwner && (
            <span className="edit-btn" onClick={descEdit}>
              <EditFilled />
            </span>
          )}
        </h2>
      )}
      <div className="profile-description">
        <p>
          {profile.overview}{" "}
          {isOwner && (
            <span className="edit-btn" onClick={descEdit}>
              <EditFilled />
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader;