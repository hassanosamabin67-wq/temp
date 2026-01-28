"use client"
import React from 'react'
import ProfileHeader from '../../dashboard/profile/profileHeader'
import ClientProfileHeader from './header'
import PaymentMethods from './payment-sectiom'
import { Col, Row } from 'antd'
import Contracts from './active-contract'
import JobPostings from './job-posting'
import NavigationBar from './join-event'
import './style.css'
import RecommendedVisionaries from './recommended'
import RecentTransactions from '../../recentTransactions'

function ClientProfileComponent() {
  return (
    <div style={{ padding: "0 30px" }}>
      <ClientProfileHeader />
      {/* <ProfileHeader /> */}
      <RecommendedVisionaries />
      {/* <PaymentMethods /> */}

      <Contracts />


      {/* <Row gutter={15}>
        <Col span={24}> */}
      <RecentTransactions />
      {/* <JobPostings /> */}
      {/* </Col>
      </Row> */}
      {/* <Row gutter={16} style={{ marginTop: 20 }}>
      <NavigationBar />
      </Row> */}

    </div>

  )
}

export default ClientProfileComponent