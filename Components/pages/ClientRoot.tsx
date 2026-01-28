"use client";
import React from "react";
import { useAppSelector } from "@/store";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { NotificationProvider } from "@/Components/custom/custom-notification";

type Props = { children: React.ReactNode };

export default function ClientRoot({ children }: Props) {
  const profile = useAppSelector((s) => s.auth);
  useOnlineStatus(profile?.profileId);

  return (
    <NotificationProvider>
      <AntdRegistry>
        {children}
      </AntdRegistry>
    </NotificationProvider>
  );
}