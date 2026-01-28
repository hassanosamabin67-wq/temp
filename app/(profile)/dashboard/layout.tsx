"use client";
import React, { Suspense } from "react";
import { UILayout } from "@/Components/custom";
import Loading from "@/Components/custom/custom-loading";
import Header from "@/Components/pages/header";
import Footer from "@/Components/pages/home/home-footer";
import SideBar from "@/Components/pages/ProfileDashboard/SideBar";
import { SidebarProvider } from "@/Components/pages/ProfileDashboard/SideBar/sidebar-context";
import useFetchProfileData from "@/hooks/profileDashboard/fetchProfileData";
import KAIFloatingWidget from "@/Components/KAIFloatingWidget";
import styles from './layout_styles.module.css'

function ProfileLayout({ children }: { children: React.ReactNode }) {
    const { profile } = useFetchProfileData();

    return (
        <UILayout>
            <SidebarProvider>
                <Suspense fallback={<Loading size="large" fullscreen />}>
                    <Header />
                    <main style={{ marginTop: "70px", display: "flex", minHeight: "100vh", backgroundColor: "#F8F9FA", position: "relative" }}>
                        {profile?.isOwnProfile && (<SideBar profile={profile} />)}
                        <div className={styles.layoutMain}>
                            {children}
                        </div>
                        <KAIFloatingWidget />
                    </main>
                    <Footer />
                </Suspense>
            </SidebarProvider>
        </UILayout>
    );
}

export default ProfileLayout;