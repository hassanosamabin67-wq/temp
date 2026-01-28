import { Button, Form, Image, Input, Modal, Tag } from "antd";
import React, { useState } from "react";
import profilePic from "@/public/assets/img/arts.png";
import { EditFilled, StarFilled, StarOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/store";
import { FaMapLocation } from "react-icons/fa6";
import { UIButton } from "@/Components/custom";
import "./client-profile.css"; // Adjust the path as necessary
import { PiNavigationArrowBold } from "react-icons/pi";
import { useRouter } from "next/navigation";
import Useprofileedit from "./useprofileedit";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import UploadPic from "@/Components/pages/profile/visionary/profile";
import { IoLocationSharp } from "react-icons/io5";
import DashboardHeader from "@/Components/custom/DashboardHeader";



function ClientProfileHeader() {
  const
    {
      editName,
      handleOk,
      handleCancel,
      editProfileName,
      setProfileFirstName,
      setProfilelasteName,
      setProfileUserName,
      handlecompanymodal,
      isEditModalOpen,
      handleCompanyOk,
      hanhandleCompanyCancel,
      setEditComapyName,
      handleCountryModal,
      isEditCountrymodalOpen,
      setEditCountry,
      handleCountryOk,
      handleCountryCancel,
      uploadedImage,
      editProfilImage,
      setEditImage,
      handleImageChange,
      setEditoverview
    } = Useprofileedit()
  const profile = useAppSelector((state) => state.auth);
  const router = useRouter()
  return (
    <>
      <div className="profile-header">
        <DashboardHeader profile={{
          profileImage: profile.profileImage || "",
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          userName: profile.userName || "",
          country: profile.country || "",
          companyName: profile.companyName || undefined,
          overview: profile.overview || undefined,
          profileType: profile.profileType || "",
          profileId: profile.profileId
        }}
          loggedInProfileType={"client"}
          imageEdit={() => setEditImage(true)}
          nameEdit={editName}
          countryEdit={handleCountryModal}
          descEdit={handlecompanymodal}
          isOnline={true}
        />
        <div className="profile-footer">
          <div>
            <div>
              Member Since: {dayjs(profile.createdAt).format("MMM DD YYYY")}
            </div>
          </div>
        </div>
      </div>

      <Modal title="Upload Profile Picture" open={editProfilImage} onOk={() => setEditImage(false)} onCancel={() => setEditImage(false)}>
        <div style={{ display: "flex", justifyContent: "center", height: "40vh" }}>
          <UploadPic onImageChange={handleImageChange} initialImage={uploadedImage} />
        </div>
      </Modal>
      <Modal title="Basic Modal" open={editProfileName} onOk={handleOk} onCancel={handleCancel}>
        <Form.Item
          label="First Name"
          name="firstName"
          rules={[{ required: true, message: 'Edit your First name!' }]}
        >
          <Input defaultValue={profile.firstName}
            onChange={(e) => setProfileFirstName(e.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[{ required: true, message: 'Edit your Last name!' }]}
        >
          <Input defaultValue={profile.lastName}
            onChange={(e) => setProfilelasteName(e.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="User Name"
          name="userName"
          rules={[{ required: true, message: 'Edit your user name!' }]}
        >
          <Input defaultValue={profile.userName}
            onChange={(e) => setProfileUserName(e.target.value)}
          />
        </Form.Item>
      </Modal>
      <Modal title="Basic Modal" open={isEditCountrymodalOpen} onOk={handleCountryOk} onCancel={handleCountryCancel}>
        <Form.Item
          label="Country Name"
          name="country"
          rules={[{ required: true, message: 'Edit your Country name!' }]}
        >
          <Input defaultValue={profile.country}
            onChange={(e) => setEditCountry(e.target.value)}
          />
        </Form.Item>
      </Modal>
      <Modal title="Basic Modal" open={isEditModalOpen} onOk={handleCompanyOk} onCancel={hanhandleCompanyCancel}>
        {/* <Form.Item
          label="Company Name"
          name="companyName"
          rules={[{ required: true, message: 'Edit your Company name!' }]}
        >
          <Input defaultValue={profile.companyName}
            onChange={(e) => setEditComapyName(e.target.value)}
          />
        </Form.Item> */}
        <Form.Item
          label="Overview"
          name="overview"
          rules={[{ required: true, message: 'Edit your overview' },
          {
            min: 200,
            message: "Overview should be 200 characters",
          },
          ]}
          initialValue={profile.overview}
        >
          <TextArea
            rows={4}
            placeholder="Describe your skills, and services."
            onChange={(e) => setEditoverview(e.target.value)}
          />
        </Form.Item>
      </Modal>

      {/* <div className="thircontainerofProfileheader">
         <div className="profile-setup">Profile Setup</div>
      
           <div className="profile-hire-button-container">
           <button onClick={()=>router.push(`/profile/${profile.profileId}`)} className="profile-hire-button">Edit Profile</button>
         </div>
        
       </div> */}
    </>
  );
}

export default ClientProfileHeader;
