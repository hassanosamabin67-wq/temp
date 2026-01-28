'use client'
import React, { useEffect, useState } from 'react';
import { Spin, Tabs, TabsProps } from 'antd';
import UserManagement from './UserManagement';
import './style.css';
import VisionaryApplication from './VisionaryApplication';
import CollabRoomManagement from './CollabRoomManagement';
import ContractToolsUsage from './ContractToolsUsage';
import FinancialOverview from './FinancialOverview';
import PlatformLogsModeration from './PlatformLogsModeration';
import AdminShortcuts from './AdminShortcut';
import AdManagement from './AdManagement';
import ChallengeManagement from './ChallengeManagement';
import { useAppSelector, useAppDispatch } from '@/store';
import LoginForm from './LoginForm';
import { supabase } from '@/config/supabase';
import { getCookie, deleteCookie } from 'cookies-next';
import { setAuthData, clearAuthData } from '@/store/slices/auth-slice';
import { Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const AdminDashboard = () => {
    const profile = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setChecking(true);

                // Check cookie data as fallback
                const cookieData = getCookie("userData");

                // First check if user is authenticated in Redux state
                if (profile.isAuthenticated && profile.profileId) {
                    // Verify if the authenticated user is actually an admin
                    const { data: adminData, error: adminFetchError } = await supabase
                        .from("users")
                        .select("userId, user_role")
                        .eq("userId", profile.profileId)
                        .eq("user_role", "admin")
                        .single();

                    if (adminFetchError || !adminData) {
                        console.error("User is not an admin or error fetching admin data:", adminFetchError);
                        setIsAuthenticated(false);
                        return;
                    }

                    setIsAuthenticated(true);
                } else if (cookieData) {
                    // Fallback to cookie data if Redux state is not available
                    try {
                        const parsedCookieData = JSON.parse(cookieData as string);

                        if (parsedCookieData.profileId && parsedCookieData.user_role === "admin") {
                            const { data: adminData, error: adminFetchError } = await supabase
                                .from("users")
                                .select("userId, user_role")
                                .eq("userId", parsedCookieData.profileId)
                                .eq("user_role", "admin")
                                .single();

                            if (adminFetchError || !adminData) {
                                console.error("Cookie user is not an admin:", adminFetchError);
                                setIsAuthenticated(false);
                                return;
                            }

                            setIsAuthenticated(true);
                        } else {
                            setIsAuthenticated(false);
                        }
                    } catch (parseError) {
                        console.error("Error parsing cookie data:", parseError);
                        setIsAuthenticated(false);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("Unexpected Error While Checking Status: ", err);
                setIsAuthenticated(false);
            } finally {
                setChecking(false);
            }
        };
        checkAuth();
    }, [profile.isAuthenticated, profile.profileId]);

    // Initialize auth state from cookie if not already set
    useEffect(() => {
        const initializeAuthFromCookie = () => {
            const cookieData = getCookie("userData");
            if (cookieData && !profile.isAuthenticated) {
                try {
                    const parsedCookieData = JSON.parse(cookieData as string);
                    dispatch(setAuthData({
                        ...parsedCookieData,
                        isAuthenticated: true
                    }));
                } catch (parseError) {
                    console.error("Error parsing cookie data:", parseError);
                }
            }
        };

        initializeAuthFromCookie();
    }, [dispatch, profile.isAuthenticated]);

    const handleLogout = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Clear Redux state
            dispatch(clearAuthData());

            // Clear cookies
            deleteCookie("userData");

            // Reset local state
            setIsAuthenticated(false);

            // Redirect to home page
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (checking) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size='large' />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginForm />;
    }

    const items: TabsProps['items'] = [
        { key: "1", label: 'Visionary', children: <VisionaryApplication adminProfile={profile} /> },
        { key: '2', label: 'User Management', children: <UserManagement adminProfile={profile} /> },
        { key: '3', label: 'Collab Room', children: <CollabRoomManagement adminProfile={profile} /> },
        { key: "4", label: "Ad Management", children: <AdManagement adminProfile={profile} /> },
        { key: "5", label: "Community Challenges", children: <ChallengeManagement adminProfile={profile} /> },
        { key: "6", label: "Contract Tools Usage", children: <ContractToolsUsage /> },
        { key: "7", label: "Financial Overview", children: <FinancialOverview /> },
        { key: '8', label: "Platform Logs & Moderation", children: <PlatformLogsModeration adminProfile={profile} /> },
        { key: "9", label: "Admin Shortcut", children: <AdminShortcuts /> }
    ];

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '1px solid #e8e8e8',
                marginBottom: '20px'
            }}>
                <span className="ad-dashboard-heading">Admin Dashboard</span>
                <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '40px',
                        padding: '0 16px'
                    }}
                >
                    Logout
                </Button>
            </div>
            <Tabs
                items={items}
                indicator={{ size: (origin) => origin - 0, align: "center" }}
                centered
                className='ad-dashboard-tab'
            />
        </div>
    );
};

export default AdminDashboard;