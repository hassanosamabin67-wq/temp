import DashboardProfile from '@/Components/pages/dashboard/profile'
import Profile from '@/Components/pages/profile/profilepage'
import { Spin } from 'antd'
import React, { Suspense } from 'react'

function ProfilePage() {
  return (
    <Suspense fallback={<Spin />}>
      <DashboardProfile />
      {/* <Profile /> */}
    </Suspense>
  )
}

export default ProfilePage