import React, { useState } from "react";
import {
  Button,
  Select,
  Upload,
  message,
  Divider,
  Checkbox,
  Form,
  Input,
  Radio,
  DatePicker,
  Steps,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { UIForm, UIFormItem } from "@/Components/custom/custom-form";
import { UIButton, UIInput } from "@/Components/custom";
import { categories, menuData } from "@/utils/services";
import { useAppDispatch, useAppSelector } from "@/store";
import dayjs from "dayjs";
import UploadPic from "./profile";
import { setAuthData } from "@/store/slices/auth-slice";
import { useRouter } from "next/navigation";
import { supabase } from "@/config/supabase";
import { useNotification } from "@/Components/custom/custom-notification";
import ContentCard from "../../dashboard/profile/profileContent/ContentCard";
import DynamicFieldSet from "@/Components/custom/custom-dynamic-form";
import '../style.css'

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const ProfileSetup = () => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth!);
  console.log(profile, "profile");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>();
  const [loader, setLoader] = useState(false);
  const router = useRouter();
  const { notify } = useNotification();
  // Synchronize form values with Redux
  const syncFormWithRedux = () => {
    const formValues = form.getFieldsValue();
    dispatch(
      setAuthData({ ...profile, ...formValues, profileImage: uploadedImage })
    );
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      syncFormWithRedux(); // Update Redux on successful validation
      setCurrentStep((prev) => prev + 1);
    } catch (error) {
      message.error("Please complete the required fields before proceeding.");
    }
  };
  console.log("pp", profile);
  const handleCategoryChange = (value: string) => {
    // Find the selected category by its id
    const selectedCategory: any = menuData.find(
      (category) => category.id === value
    );
    // Update the subcategories

    const childCats = selectedCategory?.subcategories?.flatMap((subcat: any) => subcat.childCategories) || [];
    setSubcategories(childCats);
    // Reset subcategory field in the form
    form.setFieldValue("subcategory", undefined);
    syncFormWithRedux();
  };

  const handlePrevious = () => {
    syncFormWithRedux(); // Update Redux when going back
    setCurrentStep((prev) => prev - 1);
  };

  const handleFinish = async (values: any) => {
    setLoader(true); // Set loader before the async operation
    console.log(values, "values");
    values.isSetupCompleted = true
    const { data, error: insertError }: any = await supabase
      .from("users") // Corrected table name from "users" to "profiles"
      .update({ ...profile, ...values })
      .match({ userId: profile.profileId });

    if (insertError) {
      console.error("Error updating user profile:", insertError);
      notify({
        type: "error",
        message: "Profile update failed",
      });
      setLoader(false);
    } else {
      dispatch(setAuthData({ ...profile, ...values }));
      if (!data?.stripe_account_id) {
        notify({ type: "info", message: "No Stripe account found, starting onboarding..." });
        const res = await fetch("/api/stripe/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.profileId }),
        });

        const { url } = await res.json();
        if (url) {
          window.location.href = url;
          return;
        } else {
          console.warn("Stripe onboarding URL not returned. Proceeding to profile.");
        }
      }
      notify({ message: "Profile submitted successfully!", type: "success" });
      setLoader(false);
    }
  };

  const handleImageChange = (url: string) => {
    setUploadedImage(url);
    console.log(url, "url");

    form.setFieldValue("profileImage", url); // Store in form
    syncFormWithRedux(); // Sync image change to Redux
  };

  const steps = [
    {
      title: "Profile Picture",
      content: (
        <div
          style={{ display: "flex", justifyContent: "center", height: "60vh" }}
        >
          <UploadPic
            onImageChange={handleImageChange}
            initialImage={uploadedImage}
          />

        </div>
      ),
    },
    {
      title: "General Info",
      content: (
        <>
          <div
            style={{ display: "flex", justifyContent: "center", gap: "20px" }}
          >
            <div style={{ width: "100%" }}>
              <UIFormItem
                label="Your First Name"
                name="firstName"
                rules={[
                  { required: true, message: "Please enter your first name" },
                ]}
                initialValue={profile.firstName}
              >
                <UIInput placeholder="John" style={{ width: "100%" }} />
              </UIFormItem>
            </div>
            <div style={{ width: "100%" }}>
              <UIFormItem
                label="Your Last Name"
                name="lastName"
                rules={[
                  { required: true, message: "Please enter your last name" },
                ]}
                initialValue={profile.lastName}
              >
                <UIInput placeholder="Doe" style={{ width: "100%" }} />
              </UIFormItem>
            </div>
          </div>
          <UIFormItem
            label="Your Email Address"
            name="email"
            rules={[{ required: true, message: "Please enter your email" }]}
            initialValue={profile.email}
          >
            <UIInput placeholder={profile.email} disabled />
          </UIFormItem>

          <UIFormItem
            label="Gender"
            name="gender"
            rules={[{ required: true, message: "Please select your gender" }]}
            initialValue={profile.gender}
          >
            <Radio.Group>
              <Radio value="male">Male</Radio>
              <Radio value="female">Female</Radio>
              <Radio value="other">Other</Radio>
            </Radio.Group>
          </UIFormItem>

          <UIFormItem
            label="Date of Birth"
            name="dob"
            rules={[
              { required: true, message: "Please select your date of birth" },
            ]}
            initialValue={profile.dob ? dayjs(profile.dob) : null}
          >
            <DatePicker
              placeholder="Select Date of Birth"
              format="YYYY-MM-DD"
              disabledDate={(current) =>
                current && current > dayjs().endOf("day")
              }
              style={{ width: "40%", padding: "15px 15px" }}
            />
          </UIFormItem>
        </>
      ),
    },
    {
      title: "Professional Info",
      content: (
        <>
          <UIFormItem
            label="Professional Title"
            name="title"
            rules={[
              {
                required: true,
                message: "Please enter your professional title",
              },
            ]}
            initialValue={profile.title}
          >
            <UIInput placeholder="e.g. Web Developer, UI/UX Designer" />
          </UIFormItem>

          <UIFormItem
            label="Overview"
            name="overview"
            rules={[
              {
                required: true,
                message: "Please write a brief overview about yourself",
              },
            ]}
            initialValue={profile.overview}
          >
            <TextArea
              rows={4}
              placeholder="Describe your skills, experience, and what you can offer clients."
            />
          </UIFormItem>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "100%" }}>
              <UIFormItem
                label="Category"
                name="category"
                rules={[{ required: true, message: "Please select a category" }]}
                initialValue={profile.category}
              >
                <Select
                  placeholder="Select a category"
                  onChange={handleCategoryChange}
                >
                  {menuData.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.category}
                    </Option>
                  ))}
                </Select>
              </UIFormItem>
            </div>
            <div style={{ width: "100%" }}>
              <UIFormItem
                label="Subcategory"
                name="subcategory"
                rules={[{ required: true, message: "Please select a subcategory" }]}
                initialValue={profile.subcategory}
              >
                <Select placeholder="Select a subcategory">
                  {subcategories.map((subcategory: any) => (
                    <Option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </Option>
                  ))}
                </Select>
              </UIFormItem>
            </div>
          </div>

          <UIFormItem
            label="Experience Level"
            name="experienceLevel"
            rules={[
              {
                required: true,
                message: "Please select your experience level",
              },
            ]}
            initialValue={profile.experienceLevel}
          >
            <Select placeholder="Select your experience level">
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="expert">Expert</Option>
            </Select>
          </UIFormItem>

          {/* <UIFormItem
            label="Hourly Rate ($)"
            name="hourlyRate"
            rules={[
              { required: true, message: "Please enter your hourly rate" },
            ]}
            initialValue={profile.hourlyRate}
          >
            <UIInput
              type="number"
              min={0}
              placeholder="Enter your hourly rate in USD"
            />
          </UIFormItem> */}
        </>
      ),
    },
    {
      title: "Experiences",
      content: <DynamicFieldSet name="experience" label="Experience" />
    },
    {
      title: "Workshops",
      content: <DynamicFieldSet name="workshops" label="Workshop" />
    },
    {
      title: "Certifications",
      content: <DynamicFieldSet name="certifications" label="Certification" />
    },
    {
      title: "Mentorships",
      content: <DynamicFieldSet name="mentorships" label="Mentorships" />
    },
    {
      title: "Self-taught skills",
      content: <DynamicFieldSet name="self-taught-skills" label="Self-taught skills" />
    },

  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginTop: 20 }}>Complete Your Profile</h1>
      <Steps current={currentStep}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} />
        ))}
      </Steps>
      <Divider />
      <UIForm
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 20, marginBottom: 10, padding: "30px 100px" }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: '80%', backgroundColor: ' white', padding: ' 40px 30px', borderRadius: ' 15px', boxShadow: "4px 4px 5px 0px #ededed" }}>
            {steps[currentStep].content}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            marginTop: 20,
            gap: "10px"
          }}
        >
          {currentStep > 0 && (
            <UIButton
              type="default"
              onClick={handlePrevious}
              className="Btn-style"
            >
              Previous
            </UIButton>
          )}
          {currentStep < steps.length - 1 && (
            <UIButton type="primary" className="Btn-style" onClick={handleNext}>
              Next
            </UIButton>
          )}
          {currentStep === steps.length - 1 && (
            <UIButton type="primary" className="Btn-style" htmlType="submit">
              Submit
            </UIButton>
          )}
        </div>
      </UIForm >
    </div >
  );
};

export default ProfileSetup;
