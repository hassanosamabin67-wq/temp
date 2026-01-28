import React, { useState } from 'react';
import { Collapse, Switch } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  SettingOutlined,
  ProjectOutlined,
  CreditCardOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  LogoutOutlined,
  RotateRightOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearAuthData } from '@/store/slices/auth-slice';
import { BASE_URL, BASE_URL_CLIENT } from '@/utils/constants/navigations';
import styles from './mobile-auth-accordion.module.css';

const { Panel } = Collapse;

interface MobileAuthAccordionProps {
  profileStatus: string | null;
  onNavigate: (path: string) => void;
}

const MobileAuthAccordion: React.FC<MobileAuthAccordionProps> = ({ profileStatus, onNavigate }) => {
  const profile = useAppSelector((auth) => auth.auth);
  const dispatch = useAppDispatch();
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!profile.email) {
    return (
      <div className={styles.mobileAuthButtons}>
        <button className={styles.authButton} onClick={() => onNavigate("/login")}>
          <UserOutlined /> Login
        </button>
        <button className={styles.authButton} onClick={() => onNavigate("/signup")}>
          <RotateRightOutlined /> Sign Up
        </button>
      </div>
    );
  }

  const items = [
    {
      key: 'profile-dashboard',
      label: 'Profile & Dashboard',
      children: (
        <div className={styles.accordionContent}>
          {profileStatus !== "Pending" && (
            <button className={styles.accordionButton} onClick={() =>
              onNavigate(profile.profileType === "client" ? `/${BASE_URL_CLIENT}` : `/${BASE_URL}`)
            }>
              <UserOutlined /> Profile
            </button>
          )}
          <button className={styles.accordionButton} onClick={() =>
            onNavigate(profile.profileType === "client" ? `/${BASE_URL_CLIENT}/overview` : `/${BASE_URL}/overview`)
          }>
            <DashboardOutlined /> Dashboard
          </button>
        </div>
      )
    },
    {
      key: 'account',
      label: 'Account',
      children: (
        <div className={styles.accordionContent}>
          <button className={styles.accordionButton} onClick={() =>
            onNavigate(profile.profileType === "client" ? `/${BASE_URL_CLIENT}/settings` : `/${BASE_URL}/setting`)
          }>
            <SettingOutlined /> Settings
          </button>
          <button className={styles.accordionButton} onClick={() =>
            onNavigate(profile.profileType === "client" ? `/${BASE_URL_CLIENT}/projects` : `/${BASE_URL}/projects`)
          }>
            <ProjectOutlined /> My Projects
          </button>

          {profile.profileType === 'client' ? (
            <>
              <button className={styles.accordionButton} onClick={() =>
                onNavigate(`/${BASE_URL_CLIENT}/payments`)
              }>
                <CreditCardOutlined /> Payments
              </button>
              <button className={styles.accordionButton} onClick={() =>
                onNavigate(`/${BASE_URL_CLIENT}/my-network`)
              }>
                <TeamOutlined /> My Network
              </button>
            </>
          ) : (
            <button className={styles.accordionButton} onClick={() => onNavigate(`/${BASE_URL}/earnings`)}>
              <CreditCardOutlined /> Earnings & Payouts
            </button>
          )}
        </div>
      )
    },
    {
      key: 'support',
      label: 'Support',
      children: (
        <div className={styles.accordionContent}>
          <button className={styles.accordionButton} onClick={() => onNavigate("/support-help-center")}>
            <QuestionCircleOutlined /> Help & Support
          </button>
          <div className={styles.themeToggle}>
            <BulbOutlined />
            <span>Dark Mode</span>
            <Switch size="small" checked={isDarkMode} onChange={checked => setIsDarkMode(checked)} />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={styles.mobileAuthAccordion}>
      <Collapse ghost expandIconPosition="end" items={items} className={styles.accordion} />
      <button className={`${styles.accordionButton} ${styles.logoutButton}`} onClick={() => {
        dispatch(clearAuthData());
        onNavigate("/login");
      }}>
        <LogoutOutlined /> Logout
      </button>
    </div>
  );
};

export default MobileAuthAccordion;