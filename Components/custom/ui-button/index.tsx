"use client";
import { Button, ButtonProps } from "antd";
import React from "react";

export default function UIButton(props: ButtonProps) {
  const { className = "", children } = props;
  return (
    <Button type="primary" {...props}>
      {children}
    </Button>
  );
}
