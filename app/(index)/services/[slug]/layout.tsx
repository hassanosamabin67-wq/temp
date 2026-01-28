"use client";
import Loading from "@/Components/custom/custom-loading";
import React, { Suspense } from "react";

function Servicelayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<Loading size="large" fullscreen />}>
      {children}
    </Suspense>
  );
}

export default Servicelayout;
