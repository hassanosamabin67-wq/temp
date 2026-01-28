"use client";

import { Spin } from "antd";
import React from "react";

type LoadingProps = {
  size?: "small" | "default" | "large"; // Ant Design's supported sizes
  fullscreen?: boolean; // To indicate if it should take the full screen
};

const Loading: React.FC<LoadingProps> = ({ size = "default", fullscreen = false }) => {
  return (
    <div
      style={{
        display: fullscreen ? "flex" : "inline-block",
        alignItems: "center",
        justifyContent: "center",
        height: fullscreen ? "100vh" : "auto",
        width: fullscreen ? "100vw" : "auto",
      }}
    >
      <Spin size={size} />
    </div>
  );
};

export default Loading;
