'use client'
import { UIForm, UIFormItem } from '@/Components/custom/custom-form'
import { useAppDispatch } from '@/store';
import { setAuthData } from '@/store/slices/auth-slice';
import { Button, Input } from 'antd';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
// import "../style.css"
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import { AuthState } from '@/types/userInterface';
import { logUserAction } from '@/utils/PlatformLogging';
import Link from 'next/link';
import { BASE_URL, BASE_URL_CLIENT } from '@/utils/constants/navigations';

function LoginForm() {
  const [loader, setLoader] = useState(false);

  const dispatch = useAppDispatch()
  const { notify } = useNotification();
  const router = useRouter()
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (changedValues: any) => {
    setForm({
      ...form,
      ...changedValues,
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoader(true);
      if (!values.email || !values.password) {
        notify({ type: "error", message: "Email and Password are required" });
        setLoader(false);
        return;
      }
      // Step 1: Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Login Error:", error);
        notify({ type: "error", message: error.message || "Sign-in Failed", });
        setLoader(false);
        return;
      }

      const user = data?.user;
      if (!user) {
        notify({ type: "error", message: "User authentication failed", });
        return;
      }

      // Step 2: Fetch User Data from Database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', values.email)
        .limit(1)
        .single();

      if (userError || !userData) {
        console.error("User Data Error:", userError);
        notify({ type: "error", message: "User not found in database", });
        return;
      }

      // Step 3: Store User Data in Cookie and Redux
      const userObject = userData;
      userObject.profileId = userData.userId
      console.log("Login Data Submitted:", userObject);

      setCookie("userData", JSON.stringify(userObject)); // Store user data in cookie
      dispatch(setAuthData(userObject)); // Dispatch to Redux store

      // Step 4: Navigate to Profile if Not Setup Completed
      if (!userObject.isSetupCompleted) {
        console.log("User not setup, navigating to profile:", userObject.userId);
        logUserAction.onLogin(userData.userId)
        notify({ type: "info", message: "Logged in successfully, navigating to profile setup...." });
        const profileUrl = `/profile/${userObject.userId}`;
        router.push(profileUrl);
      } else if (!userObject?.stripe_account_id) {
        console.log("No Stripe account found, starting onboarding...");
        notify({ type: "info", message: "No Stripe account found, starting onboarding..." });
        const res = await fetch("/api/stripe/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userObject.userId }),
        });

        const { url } = await res.json();
        if (url) {
          window.location.href = url;
          return;
        } else {
          console.warn("Stripe onboarding URL not returned. Proceeding to profile.");
        }
      } else if (userData.profileType.toLowerCase() == "visionary") {
        console.log("User setup completed, redirecting to profile");
        logUserAction.onLogin(userData.userId)
        notify({ type: "success", message: "Logged in successfully, redirecting to dashboard...." });
        router.push(`/${BASE_URL}`); // Navigate to a default dashboard if setup is complete
      } else {
        console.log("User setup completed, redirecting to dashboard");
        logUserAction.onLogin(userData.userId)
        notify({ type: "success", message: "Logged in successfully, redirecting to dashboard...." });
        router.push(`/${BASE_URL_CLIENT}`); // Navigate to a default dashboard if setup is complete
      }

    } catch (err) {
      console.error("Unexpected Error:", err);
      notify({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="auth-card">
      <UIForm
        onFinish={handleSubmit}
        initialValues={form}
        onValuesChange={handleChange}
        layout="vertical"
        autoComplete="off"
      >
        <UIFormItem
          label={<span style={{ color: "white", fontWeight: "bold" }}>Email</span>}
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input />
        </UIFormItem>

        <UIFormItem
          label={<span style={{ color: "white", fontWeight: "bold" }}>Password</span>}
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password />
        </UIFormItem>

        <UIFormItem>
          <Button loading={loader} className="auth-submit-btn" htmlType="submit" role="button">Login</Button>
        </UIFormItem>

        <div className="auth-link-container">
          <p className="auth-form-link">
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
          <p className="auth-form-link">
            <Link href="/forgot-password">Forgot your password?</Link>
          </p>
        </div>
      </UIForm>
    </div>
  )
}

export default LoginForm