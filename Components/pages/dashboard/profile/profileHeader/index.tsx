"use client"

import { Button, Checkbox, CheckboxProps, DatePicker, Form, Image, Input, InputNumber, Modal, Progress, Radio, Skeleton, Tag, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { RootState, useAppSelector } from "@/store";
import UploadPic from "@/Components/pages/profile/visionary/profile";
import dayjs from "dayjs";
import UseVisionaryProfileEdit from "./ts/Usevisonayprofileedit";
import "./ProfileHeader.css";
import DashboardHeader from "@/Components/custom/DashboardHeader";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import useProfileStup from "../profileContent/ts";
// import UseVisionaryProfileEdit from "./ts/UseVisionaryProfileEdit";
import { FaFileSignature } from "react-icons/fa";
import { supabase } from "@/config/supabase";
import { useNotification } from "@/Components/custom/custom-notification";
import StripePayment from "@/Components/StripePayment"
import { recordProfileStat } from "@/utils/profileStats";

const { Title } = Typography;

function VisionaryProfileHeader() {
  const {
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

    editCountry,
    saveCountry,
    isCountryModalOpen,
    setEditCountry,

    editOverview,
    isEditOverviewOpen,
    setIsEditOverviewOpen,
    editCountryModal,
    uploadedImage,
    handleImageChange,
    editProfileImage,
    setEditProfileImage,
    editOverviewModal,
    profile,
    onlineStatus,
    setOnlineStatus
  } = UseVisionaryProfileEdit();

  const searchParams = useSearchParams();
  const visionary = searchParams.get('visionary');
  const currentProfile = useAppSelector((state) => state.auth);
  const authState = useSelector((state: RootState) => state.auth);
  const [profileCompleted, setProfileCompleted] = useState(0);
  const Profile = useProfileStup();
  const [showHireModal, setShowHireModal] = useState(false);
  const [visionaryName, setVisionaryName] = useState('');
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [price, setPrice] = useState<{ priceType: string; value: number | null }>({ priceType: "", value: null });
  const [hiringDate, setHiringDate] = useState({ start_datetime: "", end_datetime: "" });
  const [hireDescription, setHireDescription] = useState("");
  const [hireTitle, setHireTitle] = useState("");
  const { notify } = useNotification();
  const [checked, setChecked] = useState(false);
  const [milestones, setMilestones] = useState<{ title: string; amount: number; due_date: string }[]>([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel("online-users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        (payload: any) => {
          console.log("User status updated", payload);
          const onlineStatus = payload.new.is_online;
          console.log("User online status", onlineStatus);
          if (onlineStatus) {
            setOnlineStatus(onlineStatus)
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", amount: 0, due_date: "" }]);
  };

  const updateMilestone = (index: any, field: any, value: any) => {
    const updated = [...milestones];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const onChange: CheckboxProps['onChange'] = (e) => {
    setChecked(e.target.checked);
  };

  const handleOpenHireModal = () => {
    form.resetFields();
    setShowHireModal(true);
    setCurrentStep(0);
    setPrice({ priceType: "", value: null });
    setHireDescription('');
    setHiringDate({ start_datetime: "", end_datetime: "" });
    setChecked(false);
    setMilestones([])
  };

  const getVisionaryDetails = async (id: any) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select('*')
        .eq("userId", id)
        .single()

      if (error) {
        console.error("Error getting visionary details: ", error)
        return
      }

      const name = data.firstName + " " + data.lastName

      setVisionaryName(name)

    } catch (err) {
      console.error("Unexpected Error: ", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authState) {
      const completedSections = [
        (Profile.profile.certifications?.length ?? 0) > 0,
        (Profile.profile.experience?.length ?? 0) > 0,
        (Profile.profile.overview?.trim().length ?? 0) > 0,
        (Profile.profile.workshops?.length ?? 0) > 0
      ].filter(Boolean).length;

      const completionPercentage = (completedSections / 4) * 100;
      setProfileCompleted(completionPercentage);
    }
  }, []);

  useEffect(() => {
    if (visionary) {
      getVisionaryDetails(visionary)
    }
  }, [visionary])

  useEffect(() => {
    if (!visionary) return
    recordProfileStat({
      profileId: authState.profileId!,
      userId: visionary!,
      type: "view"
    });
    recordProfileStat({
      profileId: authState.profileId!,
      userId: visionary!,
      type: "impression"
    });
  }, [])

  const milestoneTotalAmount = milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0);

  const steps = [
    {
      title: "First",
      content: (
        <>
          <Form.Item name="priceType">
            <Radio.Group
              value={price.priceType}
              onChange={(e) => setPrice({ priceType: e.target.value, value: null })}>
              {/* <Radio value="hourly">Hourly Rate</Radio> */}
              <Radio value="fixed">Fixed Price</Radio>
              <Radio value="milestone">Milestone</Radio>
            </Radio.Group>
          </Form.Item>

          {price.priceType === "milestone" && (
            <>
              <div>
                <Form.Item>
                  <Input
                    value={hireTitle}
                    onChange={(e) => setHireTitle(e.target.value)}
                    style={{ width: "100%" }}
                    placeholder="Enter Offer Title"
                  />
                </Form.Item>
                <Form.Item>
                  <Input.TextArea
                    value={hireDescription}
                    onChange={(e) => setHireDescription(e.target.value)}
                    rows={4}
                    placeholder="Enter Description"
                  />
                </Form.Item>
              </div>

              <div>
                {milestones.map((ms, index) => (
                  <div key={index} style={{ marginBottom: 10 }}>
                    <Input
                      placeholder="Milestone Title"
                      value={ms.title}
                      onChange={(e) => updateMilestone(index, "title", e.target.value)}
                      style={{ marginBottom: 5 }}
                    />
                    <InputNumber
                      placeholder="Amount"
                      min={0}
                      value={ms.amount}
                      onChange={(val) => updateMilestone(index, "amount", val ?? 0)}
                      style={{ marginBottom: 5, width: "100%" }}
                    />
                    <DatePicker
                      placeholder="Due Date"
                      value={ms.due_date}
                      onChange={(val) => updateMilestone(index, "due_date", val)}
                      style={{ width: "100%" }}
                    />
                    <Button
                      danger
                      onClick={() => removeMilestone(index)}
                      style={{ marginTop: 5 }}
                    >
                      Remove
                    </Button>
                    <hr />
                  </div>
                ))}
              </div>
            </>
          )}

          {
            price.priceType === "milestone" && (
              <Button type="dashed" onClick={addMilestone} block>Add Milestone</Button>
            )
          }

          {
            price.priceType === "hourly" && (
              <>
                <div>
                  <Form.Item>
                    <Input
                      value={hireTitle}
                      onChange={(e) => setHireTitle(e.target.value)}
                      style={{ width: "100%" }}
                      placeholder="Enter Offer title"
                    />
                  </Form.Item>
                </div>
                <div>
                  <Form.Item>
                    <InputNumber
                      min={0}
                      value={price.value}
                      onChange={(value) => setPrice((prev) => ({ ...prev, value: value ?? null }))}
                      style={{ width: "100%" }}
                      placeholder="Enter hourly rate"
                    />
                  </Form.Item>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Form.Item style={{ width: "100%" }} name="startDateTime">
                      <DatePicker value={hiringDate.start_datetime} onChange={(value) => setHiringDate({ ...hiringDate, start_datetime: value })} style={{ width: "100%" }} placeholder='Select Start Date' />
                    </Form.Item>
                    <Form.Item style={{ width: "100%" }} name="endDateTime">
                      <DatePicker value={hiringDate.end_datetime} onChange={(value) => setHiringDate({ ...hiringDate, end_datetime: value })} style={{ width: "100%" }} placeholder='Select End Date' />
                    </Form.Item>
                  </div>
                </div>
              </>
            )
          }

          {
            price.priceType === "fixed" && (
              <div>
                <div>
                  <Form.Item>
                    <Input
                      value={hireTitle}
                      onChange={(e) => setHireTitle(e.target.value)}
                      style={{ width: "100%" }}
                      placeholder="Enter Offer title"
                    />
                  </Form.Item>
                </div>
                <Form.Item>
                  <InputNumber
                    min={0}
                    value={price.value}
                    onChange={(value) => setPrice((prev) => ({ ...prev, value: value ?? null }))}
                    style={{ width: "100%" }}
                    placeholder="Enter fixed price"
                  />
                </Form.Item>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Form.Item style={{ width: "100%" }} name="startDateTime">
                    <DatePicker value={hiringDate.start_datetime} onChange={(value) => setHiringDate({ ...hiringDate, start_datetime: value })} style={{ width: "100%" }} placeholder='Select Start Date' />
                  </Form.Item>
                  <Form.Item style={{ width: "100%" }} name="endDateTime">
                    <DatePicker value={hiringDate.end_datetime} onChange={(value) => setHiringDate({ ...hiringDate, end_datetime: value })} style={{ width: "100%" }} placeholder='Select End Date' />
                  </Form.Item>
                </div>
              </div>
            )
          }
          {
            (price.priceType && price.priceType !== 'milestone') && (
              <Form.Item>
                <Input.TextArea value={hireDescription} onChange={(e) => setHireDescription(e.target.value)} rows={4} placeholder="Enter Description" />
              </Form.Item>
            )
          }
        </>
      ),
    },
    {
      title: "Second",
      content: (
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '20px 35px', backgroundColor: '#f1f1f1', borderRadius: 15, display: "flex", flexDirection: "column", gap: 25 }}>

          <div>
            <span className="block-span agreement-header-heading">Work-for-Hire Agreement</span>
            <span className="block-span">This Work-for-Hire Agreement (the “Agreement”) is made and entered into on [Date] by and between the following parties:</span>
          </div>

          <div>
            <div>
              <span style={{ fontWeight: "bold" }}>Client: </span>
              <span>{currentProfile.firstName} {currentProfile.lastName}</span>
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Service Provider: </span>
              <span>{visionaryName}</span>
            </div>
          </div>

          <div>
            <ol>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Scope of Work:</span>
                <span>The Service Provider agrees to perform the following services: <strong>"{hireTitle}"</strong>. All services will be performed according to the timeline and specifications agreed to through the Kaboom Collab platform.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Compensation:</span>
                <span>The Client agrees to pay the Service Provider a total of <strong> ${price.priceType === 'milestone' ? milestoneTotalAmount : price.value || 'amount'}</strong> for the completion of the work. Payment will be processed through the Kaboom Collab platform according to its standard terms.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Work-for-Hire and Ownership:</span>
                <span>The Parties agree that all work delivered under this Agreement shall be considered a 'work-for-hire.' All rights, title, and interest in the completed work shall be the sole property of the Client upon full payment.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Confidentiality:</span>
                <span>The Service Provider agrees not to disclose or use any confidential or proprietary information obtained during the course of this project.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Independent Contractor:</span>
                <span>The Service Provider is an independent contractor and not an employee of the Client. Nothing in this Agreement shall be construed as creating an employer-employee relationship.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Revisions:</span>
                <span>The Service Provider agrees to provide [#] revisions, if requested by the Client, as part of the original agreement.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Termination:</span>
                <span>Either party may terminate this Agreement with written notice. The Service Provider shall be compensated for completed work up to the termination date.</span>
              </li>
              <li className="agreement-point">
                <span className="block-span agreement-point-heading">Governing Law:</span>
                <span>This Agreement shall be governed by the laws of [Your State]. Any disputes shall be resolved in the courts located in that jurisdiction.</span>
              </li>
            </ol>
          </div>

          <div style={{ display: "flex", flexDirection: 'column', gap: 20 }}>
            <span className="block-span">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.</span>
            <div style={{ display: "flex", flexDirection: 'column', gap: 30 }}>
              <div>
                <span className="block-span">Client Signature: <strong style={{ textDecoration: "underline" }}>{currentProfile.firstName} {currentProfile.lastName}</strong></span>
                <span className="block-span">Printed Name: <strong style={{ textDecoration: "underline" }}>{currentProfile.firstName} {currentProfile.lastName}</strong></span>
                <span className="block-span">Date: <strong style={{ textDecoration: "underline" }}>{dayjs().format("MMMM DD, YYYY")}</strong></span>
              </div>
              <div>
                <span className="block-span">Service Provider Signature: <strong style={{ textDecoration: "underline" }}>{visionaryName}</strong></span>
                <span className="block-span">Printed Name: <strong style={{ textDecoration: "underline" }}>{visionaryName}</strong></span>
                <span className="block-span">Date: <strong style={{ textDecoration: "underline" }}>{dayjs().format("MMMM DD, YYYY")}</strong></span>
              </div>
            </div>
          </div>

          <div>
            <Checkbox checked={checked} onChange={onChange}>
              Accept License Agreement
            </Checkbox>
          </div>

        </div>
      ),
    },
    {
      title: "Third",
      content: (
        <StripePayment description={hireDescription || undefined} title={hireTitle || undefined} paymentAmount={price.priceType === 'milestone' ? milestoneTotalAmount : (price.value ?? 0)} clientId={currentProfile.profileId!} visionaryId={visionary || undefined} priceType={price.priceType} startDate={hiringDate.start_datetime || undefined} endDate={hiringDate.end_datetime || undefined} setShowHireModal={setShowHireModal} milestones={milestones} receiverEmail={profile.email || undefined} />
      )
    }
  ];

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields();
      }

      if (currentStep === 1 && !checked) {
        notify({ type: "error", message: "Please accept the License Agreement before proceeding." });
        return;
      }

      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.log("Validation error", err);
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  if (loading) {
    return (
      <div className="profile-header">
        <Skeleton active />
      </div>
    )
  }

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
          title: profile.title,
          profileId: profile.profileId,
        }}
          loggedInProfileType={"Visionary"}
          imageEdit={() => setEditProfileImage(true)}
          nameEdit={editName}
          countryEdit={() => editCountryModal()}
          descEdit={editOverviewModal}
          isOnline={visionary ? onlineStatus : true}
        />

        <div className="profile-footer">
          <div>
            <div>
              Member Since: {dayjs(profile.createdAt).format("MMM DD YYYY")}
            </div>
            {profile.earning || profile.hourlyRate &&
              <>
                <div>Earnings: $ {profile.earning || 0}</div>
                {/* <div>Hourly Rate: ${profile.hourlyRate || 0}</div> */}
              </>
            }
          </div>
          {visionary && currentProfile.profileType === "client" && (
            <Button className="profile-hire-button" onClick={handleOpenHireModal}>Let's Collab</Button>
          )}
          {!visionary && <div style={{ marginTop: 20 }}>
            <Progress type="circle" percent={profileCompleted} format={(percent) => ` ${percent}%`} />
            <span style={{ display: "block", fontWeight: 500, fontSize: 16, marginTop: 5 }}>Profile Completion</span>
          </div>}
        </div>
      </div>

      <Modal
        title={
          <Title level={2}>
            <div style={{ padding: "5px 30px", display: "flex", alignItems: "center", gap: 10 }}><span style={{ backgroundColor: "#2878b5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "100%", padding: 10 }}><FaFileSignature /></span> <span>Kaboom Collab – Work-for-Hire Agreement</span></div>
          </Title>
        }
        open={showHireModal}
        onCancel={() => setShowHireModal(false)}
        centered
        width={900}
        footer={null}
      >
        {currentStep < 2 ? (
          <Form
            form={form}
            layout="vertical"
            name="agreement_form"
            style={{ marginTop: 20, padding: 20 }}
          >
            {steps[currentStep].content}
          </Form>
        ) : (
          <div style={{ marginTop: 20, padding: 20 }}>
            {steps[currentStep].content}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          {currentStep > 0 && (
            <Button style={{ margin: "0 10px 0 0" }} onClick={() => prev()}>Back</Button>
          )}

          {currentStep < steps.length - 1 && (
            // <Button type="primary" onClick={() => next()} disabled={!price.value || currentStep === 1 && !checked}>Next</Button>
            <Button type="primary" onClick={() => next()} disabled={currentStep === 1 && !checked}>Next</Button>
          )}
        </div>
      </Modal>

      <Modal
        title="Upload Profile Picture"
        open={editProfileImage}
        onOk={() => setEditProfileImage(false)}
        onCancel={() => setEditProfileImage(false)}
      >
        <UploadPic
          onImageChange={handleImageChange}
          initialImage={uploadedImage}
        />
      </Modal>

      <Modal
        title="Edit Name"
        open={editProfileName}
        onOk={saveProfileName}
        onCancel={saveProfileName}
      >
        <Form.Item label="First Name">
          <Input
            defaultValue={profile.firstName}
            onChange={(e) => setProfileFirstName(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Last Name">
          <Input
            defaultValue={profile.lastName}
            onChange={(e) => setProfileLastName(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="User Name">
          <Input
            defaultValue={profile.userName}
            onChange={(e) => setProfileUserName(e.target.value)}
          />
        </Form.Item>
      </Modal>

      <Modal
        title="Edit Country"
        open={isCountryModalOpen}
        onOk={saveCountry}
        onCancel={saveCountry}
      >
        <Form.Item label="Country Name">
          <Input
            defaultValue={profile.country}
            onChange={(e) => setEditCountry(e.target.value)}
          />
        </Form.Item>
      </Modal>

      <Modal
        title="Edit Overview"
        open={isEditOverviewOpen}
        onOk={saveCompany}
        onCancel={() => setIsEditOverviewOpen(false)}
      >
        <Form.Item label="Overview">
          <Input.TextArea
            rows={4}
            defaultValue={profile.overview}
            onChange={(e) => setEditOverview(e.target.value)}
          />
        </Form.Item>
      </Modal>
    </>
  );
}

export default VisionaryProfileHeader;