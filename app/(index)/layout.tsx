"use client";
import { UILayout } from "@/Components/custom";
import Loading from "@/Components/custom/custom-loading";
import KAIFloatingWidget from "@/Components/KAIFloatingWidget";
import Header from "@/Components/pages/header";
import Footer from "@/Components/pages/home/home-footer";
import { usePathname } from "next/navigation";
import React, { Suspense, useState } from "react";

function IndexLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooterRoutes = ["/think-tank/room", "/messages", "/admin-dashboard"];

  const shouldHideFooter = hideFooterRoutes.some((route) =>
    pathname.startsWith(route)
  );

  return (
    <UILayout style={{ minHeight: "100vh", background: "#F8F9FA" }}>
      <Suspense fallback={<Loading size="large" fullscreen />}>
        <Header />
        <main style={{ marginTop: "70px" }}>{children}</main>
        <KAIFloatingWidget />
        {!shouldHideFooter && <Footer />}
      </Suspense>
    </UILayout>
  );
}

export default IndexLayout;
