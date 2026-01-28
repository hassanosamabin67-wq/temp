"use client";
import React from "react";
import { Input, Select, Checkbox, Button, Form } from "antd";
import "./style.css";
import { UIForm, UIFormItem } from "@/Components/custom/custom-form";
import CustomLogo from "@/Components/custom/custom-logo";
import CountrySelect from "@/Components/custom/country-select";

interface SignupDetailsProps {
  type: string | null;
  handleSubmit: (values: any) => void;
  form: any;
  antdForm: any;
  selectedCountry: any;
  setSelectedCountry: any;
  handleChangeFormValues: (e: any) => void;
  businessType: "company" | "individual";
}

function SignupDetails({
  type = "client",
  handleSubmit,
  form,
  antdForm,
  selectedCountry,
  setSelectedCountry,
  handleChangeFormValues,
  businessType
}: SignupDetailsProps) {

  return (
    <>
      <div>
        <CustomLogo />
      </div>
      <div className="signup-container">
        <UIForm
          form={antdForm}
          onFinish={handleSubmit}
          initialValues={form}
          layout="vertical"
          autoComplete="off"
          className="form-signup"
        >
          <div className="form-row">
            <UIFormItem
              label="First Name"
              name="firstName"
              rules={[
                { required: true, message: "Please enter your first name" },
              ]}
            >
              <Input />
            </UIFormItem>

            <UIFormItem
              label="Last Name"
              name="lastName"
              rules={[
                { required: true, message: "Please enter your last name" },
              ]}
            >
              <Input />
            </UIFormItem>

            <UIFormItem
              label="User Name"
              name="userName"
              rules={[
                { required: true, message: "Please enter your user name" },
              ]}
            >
              <Input />
            </UIFormItem>
          </div>

          <UIFormItem
            label={type === "Visionary" ? "Email" : "Work Email"}
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </UIFormItem>

          <UIFormItem
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please enter a password (8 or more characters)",
              },
              {
                min: 8,
                message: "Password must be at least 8 characters long",
              },
              {
                pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must contain at least one uppercase letter, one number, and one special character",
              },
            ]}
          >
            <Input.Password name="password" onChange={handleChangeFormValues} />
          </UIFormItem>

          <UIFormItem
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "Please confirm your password",
              },
              {
                min: 8,
                message: "Password must be at least 8 characters long",
              },
              {
                pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must contain at least one uppercase letter, one number, and one special character",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password />
          </UIFormItem>

          <UIFormItem label="Country" name="country" required>
            <CountrySelect selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
          </UIFormItem>

          <UIFormItem
            label="Tell us about your business"
            name="businessType"
            rules={[{ required: true, message: "Please select your business type" }]}
          >
            <Select placeholder="Select your role">
              <Select.Option value="individual">Individual</Select.Option>
              <Select.Option value="company">Company</Select.Option>
            </Select>
            {/* <div className="ant-form-text">
              <small>
                Choose <strong>Individual</strong> if you're applying for jobs personally.
                Choose <strong>Company</strong> if you're hiring or representing a business.
              </small>
            </div> */}
          </UIFormItem>

          {businessType === "company" && (
            <UIFormItem
              label="Company Name"
              name="companyName"
              rules={[
                { required: true, message: "Please enter your company name" },
              ]}
            >
              <Input placeholder="e.g., Acme Inc." />
            </UIFormItem>
          )}

          <UIFormItem name="receiveEmails" valuePropName="checked">
            <Checkbox className="checkbox-line">
              Send me helpful emails to find rewarding work and job leads.
            </Checkbox>
          </UIFormItem>

          <UIFormItem
            name="agreeTerms"
            valuePropName="checked"
            rules={[
              {
                validator: (_: any, value: any) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error("You must agree to the terms")),
              },
            ]}
          >
            <Checkbox className="checkbox-line">
              Yes, I understand and agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Kaboom Terms of Service
              </a>
              , including the{" "}
              <a
                href="/user-agreement"
                target="_blank"
                rel="noopener noreferrer"
              >
                User Agreement
              </a>{" "}
              and{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </Checkbox>
          </UIFormItem>

          <div className="signup-btn-container">
            <button className="btn-submit-signup">Create my account</button>
          </div>

          <p className="login-link">
            Already have an account? <a href="/login">Log In</a>
          </p>
        </UIForm>
      </div>
    </>
  );
}

export default SignupDetails;