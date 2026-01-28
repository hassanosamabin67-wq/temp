'use client'
import React, { useState } from "react";
import Header from "../header/index";
import HomeCrousal from "./home-craousal";
import HomeCrousalVison from "./home-craousal-visonaries";
import HomeAchiever from "./home-achieve";
import HomeProvider from "./home-provider";
import KaboomRole from "./home-role";
import HomeStore from "./home-store";
import Explore from "./home-explore";
import Footer from "./home-footer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAppSelector } from "@/store";

function Home() {
  const profile = useAppSelector((state) => state.auth);
  // useOnlineStatus(profile.profileId!)
  return (
    <div>
      <HomeCrousal />
      <HomeProvider />
      <HomeAchiever />
      <HomeStore />
      <HomeCrousalVison />
      <KaboomRole />
      <Explore />
    </div>
  );
}

export default Home;
