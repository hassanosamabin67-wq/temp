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
import { useAppDispatch, useAppSelector } from "@/store";
import dayjs from "dayjs";
// import UploadPic from "./profile";
import { setAuthData } from "@/store/slices/auth-slice";
import { useRouter } from "next/navigation";
import { supabase } from "@/config/supabase";
import { useNotification } from "@/Components/custom/custom-notification";
import ContentCard from "../../dashboard/profile/profileContent/ContentCard";
import DynamicFieldSet from "@/Components/custom/custom-dynamic-form";
import UploadPic from "../visionary/profile";
import { menuData } from "@/utils/services";

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
    setSubcategories(selectedCategory?.subcategories || []);
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
      console.log("Submitted Values:", data);

      if (!data?.stripe_account_id) {
        console.log("No Stripe account found, starting onboarding...");

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
      // notify({
      //   message:"Profile submitted successfully!",
      //   type: "success",});
      // router.push('/client/profile'); // Redirect or perform another action on success
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
          style={{ display: "flex", justifyContent: "center", height: "40vh" }}
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
            />
          </UIFormItem>
        </>
      ),
    },
    {
      title: "Company",
      content: (
        <>
          <UIFormItem
            label="Company"
            name="company"
            rules={[
              {
                required: true,
                message: "Please enter your company",
              },
            ]}
            initialValue={profile.title}
          >
            <UIInput placeholder="e.g. Web Developer Company, UI/UX Designer Agency" />
          </UIFormItem>

          <UIFormItem
            label="Overview"
            name="overview"
            rules={[
              {
                required: true,
                message: "Please write a brief overview about company",
              },
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
            />
          </UIFormItem>
        </>
      ),
    },


  ];

  return (
    <div style={{ maxWidth: 1260, margin: "0 auto", padding: 20 }}>
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
        style={{ marginTop: 20, marginBottom: 10 }}
      >
        {steps[currentStep].content}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          {currentStep > 0 && (
            <UIButton
              type="default"
              onClick={handlePrevious}
              style={{ marginRight: 8 }}
            >
              Previous
            </UIButton>
          )}
          {currentStep < steps.length - 1 && (
            <UIButton type="primary" onClick={handleNext}>
              Next
            </UIButton>
          )}
          {currentStep === steps.length - 1 && (
            <UIButton type="primary" htmlType="submit">
              Submit
            </UIButton>
          )}
        </div>
      </UIForm>
    </div>
  );
};

export default ProfileSetup;
