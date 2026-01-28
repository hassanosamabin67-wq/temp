"use client"
import React, { useEffect, useState } from 'react'
import ProfileHeader from './profileHeader'
import ProfileContent from './profileContent'
import ServiceSection from './profileContent/service'
import ProfileStats from './profileStats'
import Testimonials from './profileStats/Testimonials'
import WorkHistory from './profileStats/WorkHistory'
import { useSearchParams } from 'next/navigation'
import RecentTransactions from '../../recentTransactions'
import { supabase } from '@/config/supabase'
import { useAppSelector } from '@/store'
import { Spin } from 'antd'
import PortfolioSection from './PortfolioSection'

function DashboardProfile() {
  const searchParams = useSearchParams();
  const visionary = searchParams.get('visionary');
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const profile = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select("userId,status,profileType")
        .eq("userId", userId)
        .single()
      if (fetchError) {
        console.error("Error Fetching User from header ", fetchError);
        return;
      }
      if (user.profileType === 'Visionary') {
        setUserStatus(user.status)
      } else {
        setUserStatus("Approved")
      }
    } catch (err) {
      console.error("Unexpected Error: ", err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!profile?.profileId) return;
    fetchUserData(profile.profileId);
  }, [profile]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spin size='large' children={<p style={{ color: "#000000ff", fontSize: 30, fontWeight: "600" }}>Loading....</p>} />
      </div>
    )
  }

  if (userStatus === 'Pending') {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span style={{ fontSize: 30, display: "block", fontWeight: 500 }}>Your Request is Pending</span>
      </div>
    )
  }

  return (
    <div style={{ padding: "0 30px" }}>
      <ProfileHeader />
      <ProfileStats />
      {!visionary && <RecentTransactions />}
      <WorkHistory visionary={visionary} />
      {/* <Testimonials /> */}
      <PortfolioSection visionary={visionary} userId={visionary!} />
      <ProfileContent />
      <ServiceSection />
    </div>
  )
}

export default DashboardProfile