"use client";
import React, { useState } from "react";
import { Input, Button } from "antd";
import "../style.css";
import { UIForm, UIFormItem } from "@/Components/custom/custom-form";
import { setCookie } from "cookies-next";
import { useAppDispatch } from "@/store";
import { setAuthData } from "@/store/slices/auth-slice";
import { useRouter } from "next/navigation";
import { Color } from "antd/es/color-picker";
import CustomLogo from "@/Components/custom/custom-logo";
import LoginForm from "../login-form";

function Login() {
  return (
    <div className="main-auth-card-container">
      <CustomLogo />
      <div className="card-auth-container">
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;
