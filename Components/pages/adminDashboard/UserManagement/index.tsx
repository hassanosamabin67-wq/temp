'use client'
import React, { useEffect, useState } from 'react'
import style from './style.module.css'
import { Button, Col, Dropdown, Input, Row, Select, Table, Tag } from 'antd';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import { CaretDownOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import { useNotification } from '@/Components/custom/custom-notification';
import Stripe from 'stripe';
import { logUserAction } from '@/utils/PlatformLogging';
import { accountActivationNotification, accountDectivationNotification, accountResetStripeNotification } from '@/lib/adminDashboardNoifications/userManagement';
import { sendAccountReactivationEmail } from '@/utils/emailServices/adminDashbordEmailService/userManagement';
import { menuData } from '@/utils/services';

const stripe = new Stripe(process.env.NEXT_PUBLIC_SECRET_KEY!);
const { Option } = Select;
const UserManagement = ({ adminProfile }: any) => {
    const [loadingData, setLoadingData] = useState(false);
    const [data, setData] = useState<any>([]);
    const [filteredProfile, setFilteredProfile] = useState<any>([]);
    const { notify } = useNotification();
    const [selectedProfileType, setSelectedProfileType] = useState<string | undefined>(undefined)
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
    const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>('all');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);

    const checkStatus = async (user: any) => {
        try {
            const account = await stripe.accounts.retrieve(user.stripe_account_id);

            const isOnboarded = account.details_submitted && !account.requirements?.disabled_reason;
            const chch =
                account.details_submitted &&
                account.charges_enabled &&
                account.payouts_enabled &&
                !account.requirements?.disabled_reason &&
                (!account.requirements?.currently_due || account.requirements.currently_due.length === 0) &&
                (!account.requirements?.past_due || account.requirements.past_due.length === 0);

            console.log("Onboarding status:", chch);
            console.log(isOnboarded)
            console.log(account.capabilities)

        } catch (error) {
            console.error("Unexpected Error: ", error);
        }
    }

    const handleFetchProfiles = async () => {
        try {
            setLoadingData(true)
            const { data: userData, error } = await supabase
                .from('users')
                .select('userId,firstName,lastName,userName,profileType,stripe_account_id,status,isActive,createdAt,email,category,subcategory')
                .eq("user_role", "user")

            if (error) {
                console.error("Error Fetching profile", error);
                return;
            }

            setData(userData);
            setFilteredProfile(userData);

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoadingData(false)
        }
    };

    const filteredUsers = data.filter((user: any) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase().trim());

        const matchesCategory = selectedCategory === 'all' || !selectedCategory || user.category === selectedCategory;
        const matchesSubcategory = !selectedSubcategory || user.subcategory?.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim();

        const matchesStatus = !selectedStatus || user.status === selectedStatus;
        const matchesProfileType = !selectedProfileType || user.profileType === selectedProfileType;
        const matchesAccountStatus =
            !activeStatus ||
            (activeStatus === 'active' && user.isActive) ||
            (activeStatus === 'inactive' && !user.isActive);

        return (
            matchesSearch &&
            matchesCategory &&
            matchesSubcategory &&
            matchesStatus &&
            matchesProfileType &&
            matchesAccountStatus
        );
    });

    const tagType = (type: string) => {
        switch (type) {
            case 'Client':
                return <Tag color='green-inverse' >{type}</Tag>;
            case 'Visionary':
                return <Tag color='geekblue-inverse' >{type}</Tag>;
            case 'Pending':
                return <Tag color='processing' >{type}</Tag>;
            case 'Onboarded':
                return <Tag color='orange-inverse' >{type}</Tag>;
            case 'Approved':
                return <Tag color='success' >{type}</Tag>;
            case 'Rejected':
                return <Tag color='red-inverse' >{type}</Tag>;
            case 'Activated':
                return <Tag color='green' >{type}</Tag>;
            case 'Deactivated':
                return <Tag color='red' >{type}</Tag>;
            default:
                return <Tag color='processing' >{type}</Tag>;
        }
    }

    const handleDeactivate = async (userId: string, isActive: boolean, userEmail: string, userName: string) => {
        const { error } = await supabase
            .from('users')
            .update({ isActive: !isActive })
            .eq('userId', userId);

        if (error) {
            notify({ type: 'error', message: "Failed to update status" });
            return
        } else {
            logUserAction.onActivateDeactivate(isActive, userId);
            try {
                const notificationFn = isActive
                    ? accountDectivationNotification
                    : accountActivationNotification;

                const actionUrl = isActive ? '' : '/login';

                await notificationFn(adminProfile.profileId, userId, actionUrl, userEmail, userName);

                notify({ type: 'success', message: `User ${isActive ? 'deactivated' : 'reactivated'}` });
            } catch (error) {
                console.error(`Failed to ${isActive ? 'deactivate' : 'activate'} account`, error);
                notify({ type: 'error', message: `Failed to ${isActive ? 'deactivate' : 'activate'} account` });
                return;
            }
            notify({ type: 'success', message: `User ${isActive ? 'deactivated' : 'reactivated'}` });
            setData((prev: any) => {
                const updated = prev.map((user: any) =>
                    user.userId === userId ? { ...user, isActive: !isActive } : user
                );
                return updated;
            });
        }
    };

    const handleResetStripe = async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .update({ stripe_account_id: null })
            .eq('userId', userId);

        if (error) {
            notify({ type: 'error', message: "Failed to reset Stripe" });
            return
        } else {
            logUserAction.onStripeReset(userId)
            try {
                await accountResetStripeNotification(adminProfile.profileId, userId, '/login')
            } catch (error) {
                console.error("Failed to reset Stripe", error)
                notify({ type: 'error', message: "Failed to reset Stripe" });
                return
            }
            notify({ type: 'success', message: "Stripe onboarding reset" });
            setData((prev: any) => {
                const updated = prev.map((user: any) =>
                    user.userId === userId ? { ...user, stripe_account_id: null } : user
                );
                return updated;
            });
        }
    };

    const handleResendActivation = async (email: string, userName: string) => {
        try {
            await sendAccountReactivationEmail({ receiverEmail: email, firstName: userName });
            notify({ type: 'success', message: "Activation email sent" });
        } catch (error) {
            console.error("Failed to send activation email", error)
            notify({ type: 'error', message: "Failed to send activation email" });
            return
        }
        // const { error } = await supabase.auth.resend({
        //     type: 'signup',
        //     email
        // });

        // if (error) {
        //     notify({ type: 'error', message: "Failed to send activation email" });
        //     return;
        // } else {
        //     notify({ type: 'success', message: "Activation email sent" });
        // }
    };

    const dataSource = filteredUsers.map((userData: any, idx: any) => (
        {
            key: idx,
            userName: userData.userName || `${userData.firstName} ${userData.lastName}`,
            status: tagType(userData.status),
            stripe_account_id: userData.stripe_account_id,
            profileType: tagType(userData.profileType),
            isActive: (userData.isActive !== null ? tagType(userData.isActive ? "Activated" : "Deactivated") : tagType("")),
            createdAt: dayjs(userData.createdAt).format("MMMM D, YYYY"),
            actions: (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: 'deactivate',
                                label: (
                                    <span onClick={() => handleDeactivate(userData.userId, userData.isActive, userData.email, userData.firstName)}>
                                        {userData.isActive ? 'Deactivate' : 'Reactivate'}
                                    </span>
                                ),
                            },
                            {
                                key: 'reset-stripe',
                                label: (
                                    <span onClick={() => handleResetStripe(userData.userId)}>
                                        Reset Stripe Onboarding
                                    </span>
                                ),
                            },
                            {
                                key: 'resend-activation',
                                label: (
                                    <span onClick={() => handleResendActivation(userData.email, userData.firstName)}>
                                        Resend Activation Link
                                    </span>
                                ),
                            }
                        ],
                    }}
                    trigger={['click']}
                >
                    <Button icon={<MoreOutlined />} />
                </Dropdown>
            )
        }
    ))

    const columns = [
        {
            key: '1',
            title: 'USER NAME',
            dataIndex: 'userName',
        },
        {
            key: '2',
            title: 'ONBOARDING STATUS',
            dataIndex: 'status',
        },
        {
            key: '3',
            title: 'STRIPE ACCOUNT',
            dataIndex: 'stripe_account_id',
        },
        {
            key: '4',
            title: 'PROFILE TYPE',
            dataIndex: 'profileType',
        },
        {
            key: '5',
            title: 'ACCOUNT STATUS',
            dataIndex: 'isActive',
        },
        {
            key: '6',
            title: 'CREATED',
            dataIndex: 'createdAt',
        },
        {
            key: '7',
            title: 'ACTIONS',
            dataIndex: 'actions',
        },
    ];

    useEffect(() => {
        handleFetchProfiles()
    }, []);

    return (
        <div className='table'>
            <div className={style.filterDiv}>
                <div className={style.filterColumn}>
                    <Input
                        size="large"
                        placeholder="Search by name..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            borderRadius: '12px',
                            width: "100%"
                        }}
                    />
                </div>
                <div className={style.filterColumn}>
                    <Select
                        style={{ width: "100%" }}
                        size="large"
                        placeholder="Onbording Status"
                        onChange={(e) => setSelectedStatus(e)}
                        allowClear
                    >
                        <Select.Option value="Pending">Pending</Select.Option>
                        <Select.Option value="Onboarded">Onboarded</Select.Option>
                        <Select.Option value="Rejected">Rejected</Select.Option>
                        <Select.Option value="Approved">Approved</Select.Option>
                    </Select>
                </div>
                <div className={style.filterColumn}>
                    <Select
                        size="large"
                        value={selectedCategory === 'all' ? undefined : selectedCategory}
                        onChange={(value) => {
                            setSelectedCategory(value || 'all');
                            setSelectedSubcategory(undefined);
                        }}
                        style={{ minWidth: '180px', borderRadius: '12px', marginRight: 5, width: "100%" }}
                        suffixIcon={<CaretDownOutlined />}
                        placeholder="Category"
                        allowClear
                    >
                        {menuData.map((category) => (
                            <Option key={category.id} value={category.category}>
                                {category.category}
                            </Option>
                        ))}
                    </Select>
                </div>
                <div className={style.filterColumn}>
                    <Select
                        placeholder="Subcategory"
                        size="large"
                        allowClear
                        disabled={!selectedCategory}
                        value={selectedSubcategory}
                        onChange={setSelectedSubcategory}
                        style={{ minWidth: '180px', borderRadius: '12px', width: "100%" }}
                    >
                        {menuData
                            .find((cat) => cat.category === selectedCategory)
                            ?.subcategories.flatMap((sub) =>
                                sub.childCategories.map((child) => (
                                    <Select.Option key={child.id} value={child.name}>
                                        {child.name}
                                    </Select.Option>
                                ))
                            )}
                    </Select>
                </div>
                <div className={style.filterColumn}>
                    <Select
                        style={{ width: "100%" }}
                        placeholder="Profile Type"
                        size="large"
                        onChange={(e) => setSelectedProfileType(e)}
                        allowClear
                    >
                        <Select.Option value="client">Client</Select.Option>
                        <Select.Option value="Visionary">Visionary</Select.Option>
                    </Select>
                </div>
                <div className={style.filterColumn}>
                    <Select style={{ width: "100%" }} size="large" placeholder="Account Status" value={activeStatus} onChange={(e) => setActiveStatus(e)} allowClear>
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="inactive">Inactive</Select.Option>
                    </Select>
                </div>
            </div>
            <Table dataSource={dataSource} columns={columns} loading={loadingData} scroll={{ x: 1024 }} style={{ width: "100%" }} />
        </div>
    )
}

export default UserManagement