'use client';
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
    DashboardOutlined,
    UnorderedListOutlined,
    PlusCircleOutlined,
    BarChartOutlined,
    FileTextOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import Overview from './Overview';
import MyAds from './MyAds';
import UploadNewAd from './UploadNewAd';
import AdAnalytics from './AdAnalytics';
import AdGuidelines from './AdGuidelines';
import Billing from './Billing';
import Support from './Support';
import styles from './styles.module.css';

const { Content, Sider } = Layout;
const { Title } = Typography;

type MenuKey = 'overview' | 'my-ads' | 'upload' | 'analytics' | 'guidelines' | 'billing' | 'support';

const AdvertiserDashboard = () => {
    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedMenu, setSelectedMenu] = useState<MenuKey>('overview');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check authentication and URL parameters
    useEffect(() => {
        if (!profile.profileId) {
            router.push('/login');
        }
    }, [profile.isAuthenticated, profile.profileId, router]);

    // Check if mobile view
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileSidebarVisible(false);
            }
        };
        
        // Initial check
        checkIfMobile();
        
        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Handle URL parameters for direct navigation
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['overview', 'my-ads', 'upload', 'analytics', 'guidelines', 'billing', 'support'].includes(tab)) {
            setSelectedMenu(tab as MenuKey);
        }
    }, [searchParams]);

    // Show loading while checking auth
    if (!profile.profileId) {
        return (
            <div className={styles.loadingContainer}>
                <p>Redirecting to login...</p>
            </div>
        );
    }

    const menuItems = [
        {
            key: 'overview',
            icon: <DashboardOutlined />,
            label: 'Overview',
        },
        {
            key: 'my-ads',
            icon: <UnorderedListOutlined />,
            label: 'My Ads',
        },
        {
            key: 'upload',
            icon: <PlusCircleOutlined />,
            label: 'Upload New Ad',
        },
        {
            key: 'analytics',
            icon: <BarChartOutlined />,
            label: 'Ad Analytics',
        },
        {
            key: 'billing',
            icon: <CreditCardOutlined />,
            label: 'Billing & Invoices',
        },
        {
            key: 'guidelines',
            icon: <FileTextOutlined />,
            label: 'Ad Guidelines',
        },
        {
            key: 'support',
            icon: <CustomerServiceOutlined />,
            label: 'Support',
        },
    ];

    const handleMenuClick = (key: MenuKey) => {
        setSelectedMenu(key);
        // Update URL based on selected menu
        if (key === 'overview') {
            router.push('/advertise/dashboard');
        } else {
            router.push(`/advertise/dashboard?tab=${key}`);
        }
        // Close sidebar on mobile after menu item click
        if (isMobile) {
            setMobileSidebarVisible(false);
        }
    };

    const renderContent = () => {
        switch (selectedMenu) {
            case 'overview':
                return <Overview onNavigate={handleMenuClick} />;
            case 'my-ads':
                return <MyAds />;
            case 'upload':
                return <UploadNewAd />;
            case 'analytics':
                return <AdAnalytics />;
            case 'billing':
                return <Billing />;
            case 'guidelines':
                return <AdGuidelines />;
            case 'support':
                return <Support />;
            default:
                return <Overview onNavigate={handleMenuClick} />;
        }
    };

    return (
        <div className={styles.dashboardWrapper}>
            <Layout className={styles.dashboardLayout}>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    className={`${styles.sider} ${!mobileSidebarVisible && isMobile ? styles.hiddenMobile : ''}`}
                    width={250}
                >
                    <div className={styles.logo}>
                        <Title level={4} className={styles.logoText}>
                            {collapsed ? 'AD' : 'Advertiser Dashboard'}
                        </Title>
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[selectedMenu]}
                        items={menuItems}
                        onClick={({ key }) => handleMenuClick(key as MenuKey)}
                    />
                </Sider>
                <Layout>
                    <Content className={styles.content}>
                        <span 
                        className={styles.menuIcon} 
                        onClick={() => setMobileSidebarVisible(!mobileSidebarVisible)}
                    >
                        <MenuOutlined />
                    </span>
                        {renderContent()}
                    </Content>
                </Layout>
            </Layout>
        </div>
    );
};

export default AdvertiserDashboard;