import Card from "@/Components/pages/auth/signup/card/card";
import React, { useState } from "react";
import SignupDetails from "./signup-details";
import { useRouter } from "next/navigation";
import { Form } from "antd";
import { supabase } from "@/config/supabase";
import { useNotification } from "@/Components/custom/custom-notification";
import CustomSpin from "@/Components/custom/customCenterSpin";
import { logUserAction } from "@/utils/PlatformLogging";
import { sendWelcomeEmail } from "@/utils/emailServices/emailServices";
import SignupConfirmation from "../SignupConfirmation";

function SignuComponenet() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loader, setLoader] = useState(false);
  const [antdForm] = Form.useForm();
  const router = useRouter();
  const { notify } = useNotification();
  const [isContinue, setIsContinue] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{
    label: string;
    value: string;
  }>({ label: "", value: "" });
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    country: selectedCountry,
    website: "",
    businessType: "individual",
    companyName: "",
    receiveEmails: false,
    agreeTerms: false,
    profileType: selected,
    isSetupCompleted: false,
    isVerified: false,
  });

  const businessType = Form.useWatch('businessType', antdForm);

  const handleSubmit = async (values: any) => {
    setLoader(true);
    values.country = selectedCountry ? selectedCountry?.label?.slice(5) : "";
    setForm(values);

    try {
      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.log(error);
        notify({ type: "error", message: error.message || "Signup Failed" });
        setLoader(false);
        return;
      }

      const user = data.user;

      if (user) {
        // Step 2: Insert into users table
        const { error: insertError } = await supabase.from("users").insert([
          {
            userId: user.id,
            firstName: values.firstName,
            lastName: values.lastName,
            userName: values.userName,
            email: values.email,
            country: values.country,
            website: values.website,
            isVerified: false,
            businessType: values.businessType,
            companyName: values.companyName,
            receiveEmails: values.receiveEmails,
            agreeTerms: values.agreeTerms,
            profileType: selected,
            status: selected === "client" ? 'Approved' : 'Pending'
          },
        ]);

        if (insertError) {
          console.error("Error inserting user profile:", insertError);
          notify({ type: "error", message: "Profile creation failed" });
          setLoader(false);
          return;
        }

        // Step 3: Log user action
        logUserAction.onSignup(user.id);

        // Step 4: Send welcome email
        try {
          await sendWelcomeEmail({
            receiverEmail: values.email,
            firstName: values.firstName,
            profileType: selected === "client" ? "client" : "visionary"
          });

          setShowConfirmationModal(true)

        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          notify({ type: "success", message: "Account created successfully! You can now log in." });
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      notify({ type: "error", message: "An unexpected error occurred during signup" });
    } finally {
      setLoader(false);
    }
  }

  const handleChangeFormValues = (e: any) => {
    console.log(e.target.value, e.target);
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelection = (type: string) => {
    setSelected(type);
  };

  return (
    <div>
      {isContinue ? (
        <>
          {loader ? (
            <CustomSpin />
          ) : (
            <SignupDetails
              type={selected}
              handleSubmit={handleSubmit}
              form={form}
              antdForm={antdForm}
              businessType={businessType}
              setSelectedCountry={setSelectedCountry}
              selectedCountry={selectedCountry}
              handleChangeFormValues={handleChangeFormValues}
            />
          )}
          <SignupConfirmation onOpen={showConfirmationModal} onCancel={() => setShowConfirmationModal(false)} email={form.email} />
        </>
      ) : (
        <Card
          selected={selected}
          setIsContinue={setIsContinue}
          handleSelection={handleSelection}
        />
      )
      }
    </div >
  );
}

export default SignuComponenet;