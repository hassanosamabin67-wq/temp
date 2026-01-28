"use client";
import Image, { StaticImageData } from "next/image";
import React from "react";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  lastSeen?: string | null;
  isOnlineFlag?: boolean | null;
  fallbackSrc?: StaticImageData | string;
  className?: string;
  onlineDotStyle?: React.CSSProperties;
};

export default function UserAvatar({
  src,
  alt = "user",
  size = 48,
  lastSeen,
  isOnlineFlag,
  fallbackSrc = "/default-user.png",
  className = "",
  onlineDotStyle = {},
}: Props) {
  const showOnline =
    typeof isOnlineFlag === "boolean"
      ? isOnlineFlag
      : lastSeen
      ? Date.now() - new Date(lastSeen).getTime() < 30_000
      : false;

  const onlineDotStyles: React.CSSProperties = {
    position: "absolute",
    right: "4px",
    bottom: "8px",
    transform: "translate(25%, 25%)",
    width: Math.max(10, size * 0.22),
    height: Math.max(10, size * 0.22),
    borderRadius: "9999px",
    boxShadow: "0 0 0 2px white",
    backgroundColor: "#16a34a",
    display: "inline-block",
    ...onlineDotStyle, // Merge with passed styles
  };

  return (
    <div style={{ position: "relative" }}>
      <Image
        src={src || fallbackSrc}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: "100%" }}
      />
      {showOnline && <span style={onlineDotStyles} aria-hidden />}
    </div>
  );
}
