"use client";
import Loading from "@/Components/custom/custom-loading";
import Header from "@/Components/pages/header";
import Footer from "@/Components/pages/home/home-footer";
import ServiceHeader from "@/Components/pages/services/service-header";
import Banner from "@/Components/pages/services/service-list/banner";
import SubcategoryMenu from "@/Components/pages/services/service-list/subcategory-menu";
import { useAppDispatch } from "@/store";
import {
  setSelectedCategory,
  setSelectedSubcategories,
  setSelectedSubcategory,
} from "@/store/slices/selectedCategory";
import { menuData } from "@/utils/services";
import { Menu } from "antd";
import { useRouter, usePathname } from "next/navigation";
import React, { Suspense, useState } from "react";

function Servicelayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Show ServiceHeader only on slug pages (not on main /services page)
  const isSlugPage = pathname !== '/services' && pathname.startsWith('/services/');

  return (
    <div>
      {isSlugPage && <ServiceHeader />}
      {/* <Banner /> */}
      {/* <SubcategoryMenu /> */}
      <Suspense fallback={<Loading size="large" fullscreen />}>
        {children}
      </Suspense>
    </div>
  );
}

export default Servicelayout;
