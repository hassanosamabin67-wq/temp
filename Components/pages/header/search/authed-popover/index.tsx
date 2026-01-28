import React, { useState } from 'react'
import { UIButton } from '@/Components/custom'
import CustomPopover from '@/Components/custom/custom-popover'
import { useAppDispatch, useAppSelector } from '@/store'
import { clearAuthData } from '@/store/slices/auth-slice'
import { BASE_URL, BASE_URL_CLIENT } from '@/utils/constants/navigations'
import { BulbOutlined, CreditCardOutlined, DashboardOutlined, LogoutOutlined, ProjectOutlined, QuestionCircleOutlined, SettingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Col, Divider, Row, Switch } from 'antd'
import { useRouter } from 'next/navigation'

function AuthedPopover({ profileStatus }: { profileStatus: string | null }) {
  const router = useRouter()
  const profile = useAppSelector((auth => auth.auth))
  const dispatch = useAppDispatch()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleLogout = () => {
    dispatch(clearAuthData())
    router.push("/");
  }

  const handleProfile = () => {
    profile.profileType == "client" ?
      router.push(`/${BASE_URL_CLIENT}`) :
      router.push(`/${BASE_URL}`);
  }

  const handleDashboard = () => {
    profile.profileType == "client" ?
      router.push(`/${BASE_URL_CLIENT}/overview`) :
      router.push(`/${BASE_URL}/overview`);
  }

  const handleSettings = () => {
    profile.profileType == "client" ?
      router.push(`/${BASE_URL_CLIENT}/settings`) :
      router.push(`/${BASE_URL}/setting`);
  }

  const handleProjects = () => {
    profile.profileType == "client" ?
      router.push(`/${BASE_URL_CLIENT}/projects`) :
      router.push(`/${BASE_URL}/projects`);
  }

  const handlePayments = () => {
    profile.profileType == "client" ?
      router.push(`/${BASE_URL_CLIENT}/payments`) :
      router.push(`/${BASE_URL}/payments`);
  }

  const handleNetwork = () => {
    profile.profileType == "client" ?
      router.push(`/${BASE_URL_CLIENT}/my-network`) :
      router.push(`/${BASE_URL}/my-network`);
  }

  const handleEarnings = () => {
    router.push(`/${BASE_URL}/earnings`);
  }

  const handleHelp = () => {
    router.push("/support-help-center");
  }

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    // Add your theme toggle logic here
    // For example: document.body.setAttribute('data-theme', checked ? 'dark' : 'light')
  }

  return (
    <div className="navbar-user">
      <CustomPopover
        placement="bottomRight"
        content={
          <div className="popover-content" style={{ minWidth: '220px' }}>
            {/* Profile & Dashboard Section */}
            <div className="popover-section">
              <div className="section-title" style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                PROFILE & DASHBOARD
              </div>
              <Row>
                <Col span={24}>
                  {profileStatus !== "Pending" && (
                    <UIButton
                      type="text"
                      className="popover-button"
                      icon={<UserOutlined />}
                      onClick={handleProfile}
                      style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      Profile
                    </UIButton>
                  )}
                  <UIButton
                    type="text"
                    className="popover-button"
                    icon={<DashboardOutlined />}
                    onClick={handleDashboard}
                    style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    Dashboard
                  </UIButton>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Account Section */}
            <div className="popover-section">
              <div className="section-title" style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                ACCOUNT
              </div>
              <Row>
                <Col span={24}>
                  <UIButton
                    type="text"
                    className="popover-button"
                    icon={<SettingOutlined />}
                    onClick={handleSettings}
                    style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    Settings
                  </UIButton>
                  <UIButton
                    type="text"
                    className="popover-button"
                    icon={<ProjectOutlined />}
                    onClick={handleProjects}
                    style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    My Projects
                  </UIButton>

                  {profile.profileType === 'client' ? (
                    <>
                      <UIButton
                        type="text"
                        className="popover-button"
                        icon={<CreditCardOutlined />}
                        onClick={handlePayments}
                        style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        Payments
                      </UIButton>
                      <UIButton
                        type="text"
                        className="popover-button"
                        icon={<TeamOutlined />}
                        onClick={handleNetwork}
                        style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        My Network
                      </UIButton>
                    </>
                  ) : (
                    <UIButton
                      type="text"
                      className="popover-button"
                      icon={<CreditCardOutlined />}
                      onClick={handleEarnings}
                      style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      Earnings & Payouts
                    </UIButton>
                  )}

                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Support Section */}
            <div className="popover-section">
              <div className="section-title" style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                SUPPORT
              </div>
              <Row>
                <Col span={24}>
                  <UIButton
                    type="text"
                    className="popover-button"
                    icon={<QuestionCircleOutlined />}
                    onClick={handleHelp}
                    style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    Help & Support
                  </UIButton>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    gap: '8px'
                  }}>
                    <BulbOutlined />
                    <span style={{ flex: 1 }}>Dark Mode</span>
                    <Switch
                      size="small"
                      checked={isDarkMode}
                      onChange={handleThemeToggle}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Logout Section */}
            <Row>
              <Col span={24}>
                <UIButton
                  type="text"
                  className="popover-button"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    color: '#ff4d4f'
                  }}
                >
                  Logout
                </UIButton>
              </Col>
            </Row>
          </div>
        }
      >
        <UserOutlined className="user-icon" style={{ fontSize: 18 }} />
      </CustomPopover>
    </div>
  )
}

export default AuthedPopover