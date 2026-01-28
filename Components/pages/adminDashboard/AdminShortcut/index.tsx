import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Badge, Row, Col, Tag, Avatar, MenuProps, Dropdown, Form, Input, Modal, Typography, Select, Spin, Statistic, Divider } from 'antd';
import { FiZap, FiUserCheck, FiGift, FiMail, FiCheckCircle, FiXCircle, FiRefreshCw, FiMoreVertical, FiSend, FiUsers, FiCreditCard } from 'react-icons/fi';
import { supabase } from '@/config/supabase';
import { logUserAction, visionaryApplication } from '@/utils/PlatformLogging';
import { useNotification } from '@/Components/custom/custom-notification';
import { useAppSelector } from '@/store';
import { visionaryAcceptApplicationNotification, visionaryRejectApplicationNotification } from '@/lib/adminDashboardNoifications/visionaryApplications';
import { accountResetStripeNotification } from '@/lib/adminDashboardNoifications/userManagement';
import { sendManualCollabCardInvitation, getEligibleUsersForInvitation, getCollabCardInvitationStats } from '@/lib/adminDashboardNoifications/collabCardInvitation';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminShortcuts = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>([]);
    const { notify } = useNotification();
    const [form] = Form.useForm();
    const [showMessageModal, setShowMessageModal] = useState(false);
    const profile = useAppSelector((state) => state.auth);
    const [recordUser, setRecordUser] = useState('');
    const [sendMessageLoading, setSendMessageLoading] = useState(false);

    // Collab Card Invitation States
    const [showCollabCardModal, setShowCollabCardModal] = useState(false);
    const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [collabCardLoading, setCollabCardLoading] = useState(false);
    const [invitationStats, setInvitationStats] = useState<any>(null);
    const [fetchingEligibleUsers, setFetchingEligibleUsers] = useState(false);

    const sendMessageModal = (id: string) => {
        setShowMessageModal(true)
        setRecordUser(id)
    }

    // Collab Card Invitation Functions
    const openCollabCardModal = async () => {
        setShowCollabCardModal(true);
        await fetchEligibleUsersAndStats();
    };

    const fetchEligibleUsersAndStats = async () => {
        setFetchingEligibleUsers(true);
        try {
            const [users, stats] = await Promise.all([
                getEligibleUsersForInvitation(),
                getCollabCardInvitationStats()
            ]);
            setEligibleUsers(users);
            setInvitationStats(stats);
        } catch (error) {
            console.error('Error fetching eligible users:', error);
            notify({ type: 'error', message: 'Failed to fetch eligible users' });
        } finally {
            setFetchingEligibleUsers(false);
        }
    };

    const handleSendCollabCardInvitation = async () => {
        if (!selectedUserId) {
            notify({ type: 'warning', message: 'Please select a user to invite' });
            return;
        }

        const userToInvite = eligibleUsers.find(u => u.userId === selectedUserId);
        if (!userToInvite) {
            notify({ type: 'error', message: 'User not found' });
            return;
        }

        setCollabCardLoading(true);
        try {
            const result = await sendManualCollabCardInvitation(
                profile.profileId!,
                userToInvite.userId,
                userToInvite.email,
                userToInvite.firstName || '',
                userToInvite.lastName || '',
                userToInvite.earning || 0
            );

            if (result.success) {
                notify({ type: 'success', message: getSuccessMessage('trigger-invitation') });
                // Close modal first, then reset state
                setShowCollabCardModal(false);
                // Use setTimeout to batch state updates and avoid flickering
                setTimeout(() => {
                    setSelectedUserId('');
                    // Remove the invited user from the list without refetching
                    setEligibleUsers(prev => prev.filter(u => u.userId !== userToInvite.userId));
                    // Update stats locally
                    if (invitationStats) {
                        setInvitationStats({
                            ...invitationStats,
                            total_invitations: (invitationStats.total_invitations || 0) + 1,
                            pending_invitations: (invitationStats.pending_invitations || 0) + 1
                        });
                    }
                }, 100);
            } else {
                notify({ type: 'error', message: result.error || 'Failed to send invitation' });
            }
        } catch (error) {
            console.error('Error sending Collab Card invitation:', error);
            notify({ type: 'error', message: 'Failed to send Collab Card invitation' });
        } finally {
            setCollabCardLoading(false);
        }
    };

    const handleSendInvitationFromTable = async (userId: string, email: string) => {
        const user = data.find((u: any) => u.userId === userId);
        if (!user) {
            notify({ type: 'error', message: 'User not found' });
            return;
        }

        setCollabCardLoading(true);
        try {
            const result = await sendManualCollabCardInvitation(
                profile.profileId!,
                userId,
                email,
                user.firstName || '',
                user.lastName || '',
                0
            );

            if (result.success) {
                notify({ type: 'success', message: getSuccessMessage('trigger-invitation') });
            } else {
                notify({ type: 'error', message: result.error || 'Failed to send invitation' });
            }
        } catch (error) {
            console.error('Error sending Collab Card invitation:', error);
            notify({ type: 'error', message: 'Failed to send Collab Card invitation' });
        } finally {
            setCollabCardLoading(false);
        }
    };

    const handleFetchProfiles = async () => {
        try {
            setLoading(true)
            const { data: userData, error } = await supabase
                .from('users')
                .select('userId,firstName,lastName,userName,email,profileType,stripe_account_id,status,isActive,createdAt')
                .eq("user_role", "user")

            if (error) {
                console.error("Error Fetching profile", error);
                return;
            }

            setData(userData);

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoading(false)
        }
    };

    const handleAccept = async (userId: string, userEmail: string) => {
        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({ status: 'Approved' })
                .eq("userId", userId)

            if (updateError) {
                notify({ type: 'error', message: `Error Approving application` })
                console.error(`Error Approving application`, updateError);
                return;
            }

            visionaryApplication.onAcceptReject('Approved', userId);
            try {
                await visionaryAcceptApplicationNotification(profile.profileId!, userId, '/profile', userEmail)
            } catch (error) {
                notify({ type: 'error', message: `Error Approving application` })
                console.error(`Error Approving application`, updateError);
                return;
            }

            setData((prev: any) => prev.map((user: any) => user.userId === userId ? { ...user, status: 'Approved' } : user));

            notify({ type: 'success', message: `Application Approved Successfully` })

        } catch (err) {
            console.error('Unexpected Error: ', err);
        }
    }

    const handleReject = async (userId: string, userEmail: string) => {
        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({ status: 'Rejected' })
                .eq("userId", userId)

            if (updateError) {
                notify({ type: 'error', message: `Error Rejecting application` })
                console.error(`Error Rejectingapplication`, updateError);
                return;
            }

            visionaryApplication.onAcceptReject('Rejected', userId);
            try {
                await visionaryRejectApplicationNotification(profile.profileId!, userId, '', userEmail)
            } catch (error) {
                notify({ type: 'error', message: `Error Rejecting application` })
                console.error(`Error Rejecting application`, updateError);
                return;
            }
            setData((prev: any) => prev.map((user: any) => user.userId === userId ? { ...user, status: 'Rejected' } : user));

            notify({ type: 'success', message: `Application Rejected` })

        } catch (err) {
            console.error('Unexpected Error: ', err);
        }
    }

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
                await accountResetStripeNotification(profile.profileId!, userId, '/login')
            } catch (error) {
                console.error("Failed to reset Stripe", error)
                notify({ type: 'error', message: "Failed to reset Stripe" });
                return
            }
            notify({ type: 'success', message: "Stripe onboarding reset" });
        }
    };

    const handleSendMessage = async (profileId: string, participantId: string) => {
        try {
            setSendMessageLoading(true)
            await form.validateFields();
            const values = await form.getFieldsValue();

            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let conversationId;

            if (existingConversation) {
                conversationId = existingConversation.id
            }

            if (!existingConversation) {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                conversationId = newConversation.id;
            }

            const messagePayload = {
                message: values.message.trim() || null,
                sender_id: profileId,
                message_type: 'text'
            };

            const insertData = { ...messagePayload, receiver_id: participantId, inbox_conversation_id: conversationId };

            const { error } = await supabase.from("messages").insert([insertData]);

            if (error) {
                notify({ type: 'error', message: "Message sending failed" });
                console.error('Message sending failed', error);
                return;
            }

            notify({ type: 'success', message: getSuccessMessage('send-message') });
            form.resetFields();
            setShowMessageModal(false);
        } catch (err) {
            console.error("Failed to send message:", err);
            notify({ type: 'error', message: "Failed to send message" });
        } finally {
            setSendMessageLoading(false);
        }
    };

    useEffect(() => {
        handleFetchProfiles()
    }, [])

    // Mock data for visionary applications
    const visionaryApplications = data.map((userData: any) => ({
        key: userData.userId,
        name: `${userData.firstName} ${userData.lastName}`,
        userName: userData.userName || "",
        email: userData.email,
        userId: userData.userId,
        status: (userData.status === null ? "N/A" : userData.status),
        accountStatus: (userData.isActive !== null ? userData.isActive ? "Activated" : "Deactivated" : ""),
        profileType: userData.profileType
    }))

    const getSuccessMessage = (type: any) => {
        switch (type) {
            case 'reset-onboarding':
                return 'User onboarding process has been reset successfully!';
            case 'reset-stripe':
                return 'Stripe payment links have been reset successfully!';
            case 'send-message':
                return 'Manual message has been sent successfully!';
            case 'send-alert':
                return 'System alert has been broadcast successfully!';
            case 'trigger-invitation':
                return 'Collab Card invitations have been triggered successfully!';
            default:
                return 'Action completed successfully!';
        }
    };

    const tagType = (type: string) => {
        switch (type) {
            case 'Client':
                return 'green';
            case 'Visionary':
                return 'geekblue';
            case 'Pending':
                return 'processing';
            case 'Onboarded':
                return 'orange';
            case 'Approved':
                return 'success';
            case 'Rejected':
                return 'red';
            default:
                return 'processing';
        }
    }

    // Visionary Applications Table Columns
    const visionaryColumns = [
        {
            title: 'User',
            key: 'user',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar size={40} style={{ backgroundColor: '#1890ff', marginRight: '12px' }}>
                        {record.name.split(' ').map((n: any) => n[0]).join('')}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.userName ? `@${record.userName}` : ""}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: any, record: any) => (
                <div>
                    <div>{record.email}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.userId}</div>
                </div>
            ),
        },
        {
            title: 'Application/Onboarding status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Badge status={status === "Approved" ? "success" : status === "Pending" ? "warning" : status === "Onboarded" ? "processing" : "error"} text={status.charAt(0).toUpperCase() + status.slice(1)} />
            )
        },
        {
            title: 'Account Status',
            dataIndex: 'accountStatus',
            key: 'accountStatus',
            render: (accountStatus: string) => (
                <Tag color={tagType(accountStatus)}>
                    {accountStatus}
                </Tag>
            ),
        },
        {
            title: 'Profile Type',
            dataIndex: 'profileType',
            key: 'profileType',
            render: (profileType: string) => (
                <Tag color={tagType(profileType)}>
                    {profileType}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => {
                const actionMenu: MenuProps['items'] = [
                    {
                        key: "1",
                        label: "Approve Application",
                        icon: (<FiCheckCircle />),
                        onClick: () => handleAccept(record.userId, record.email)
                    },
                    {
                        key: "2",
                        label: "Reject Application",
                        icon: (<FiXCircle />),
                        onClick: () => handleReject(record.userId, record.email)
                    },
                    {
                        key: "3",
                        label: "Send Message",
                        icon: (<FiMail />),
                        onClick: () => sendMessageModal(record.userId)
                    },
                    {
                        key: "4",
                        label: "Reset Stripe Onboarding",
                        icon: (<FiRefreshCw />),
                        onClick: () => handleResetStripe(record.userId)
                    },
                    {
                        key: "5",
                        label: "Send Collab Card Invitation",
                        icon: (<FiCreditCard />),
                        onClick: () => handleSendInvitationFromTable(record.userId, record.email)
                    }
                ];

                return (
                    <Dropdown menu={{ items: actionMenu }} trigger={['click']}>
                        <Button type="text" icon={<FiMoreVertical />} size="small" />
                    </Dropdown>
                );
            },
        },
    ];

    const MessageModal = () => (
        <Modal
            title={
                <Title level={2} style={{ marginBottom: 0 }}>
                    Send manual message
                </Title>
            }
            open={showMessageModal}
            onCancel={() => setShowMessageModal(false)}
            centered
            width={600}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                name="admin_message_form"
                style={{ marginTop: 20 }}
            >
                <Form.Item name="message" label="Message" rules={[{ required: true, message: "Please enter the message!" }]}>
                    <Input.TextArea placeholder="Write Your Message" rows={3} />
                </Form.Item>
                <div style={{ margin: "10px 0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <Button onClick={() => setShowMessageModal(false)}>
                        Cancel
                    </Button>,
                    <Button type="primary" onClick={() => handleSendMessage(profile.profileId!, recordUser)} loading={sendMessageLoading}>
                        Send Message
                    </Button>
                </div>
            </Form>
        </Modal>
    )

    // Get selected user for preview
    const selectedUser = eligibleUsers.find(u => u.userId === selectedUserId);

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <MessageModal />

            {/* Collab Card Invitation Modal - Inline to prevent re-mount flickering */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiGift style={{ color: '#722ed1', fontSize: 24 }} />
                        <Title level={3} style={{ marginBottom: 0 }}>
                            Send Collab Card Invitation
                        </Title>
                    </div>
                }
                open={showCollabCardModal}
                onCancel={() => {
                    setShowCollabCardModal(false);
                    setSelectedUserId('');
                }}
                centered
                width={700}
                footer={null}
                destroyOnClose={false}
            >
                <div style={{ marginTop: 20 }}>
                    {/* Statistics Section */}
                    {invitationStats && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 24 }}>
                            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f5ff' }}>
                                <Statistic
                                    title="Total Sent"
                                    value={invitationStats.total_invitations || 0}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
                                <Statistic
                                    title="Pending"
                                    value={invitationStats.pending_invitations || 0}
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Card>
                            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
                                <Statistic
                                    title="Accepted"
                                    value={invitationStats.accepted_invitations || 0}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff1f0' }}>
                                <Statistic
                                    title="Expired"
                                    value={invitationStats.expired_invitations || 0}
                                    valueStyle={{ color: '#ff4d4f' }}
                                />
                            </Card>
                        </div>
                    )}

                    <Divider />

                    {/* User Selection */}
                    <div style={{ marginBottom: 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Select User to Invite
                        </Text>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                            Choose a user who doesn't have an active Collab Card or pending invitation
                        </Text>

                        {fetchingEligibleUsers ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <Spin size="large" />
                                <Text style={{ display: 'block', marginTop: 16 }}>Loading eligible users...</Text>
                            </div>
                        ) : (
                            <Select
                                showSearch
                                style={{ width: '100%' }}
                                placeholder="Search and select a user"
                                optionFilterProp="children"
                                value={selectedUserId || undefined}
                                onChange={(value) => setSelectedUserId(value)}
                                filterOption={(input, option) =>
                                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                size="large"
                                notFoundContent={
                                    eligibleUsers.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 20 }}>
                                            <FiUsers style={{ fontSize: 32, color: '#d9d9d9' }} />
                                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                No eligible users found
                                            </Text>
                                        </div>
                                    ) : null
                                }
                            >
                                {eligibleUsers.map((user) => (
                                    <Option
                                        key={user.userId}
                                        value={user.userId}
                                        label={`${user.firstName} ${user.lastName} ${user.email} ${user.userName || ''}`}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar size={32} style={{ backgroundColor: '#722ed1', marginRight: 12 }}>
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </Avatar>
                                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: 'space-between' }}>
                                                    <div style={{ fontWeight: 500, lineHeight: "1" }}>
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: "1" }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <Tag color={user.earning >= 500 ? 'green' : 'orange'}>
                                                    ${(user.earning || 0).toFixed(2)}
                                                </Tag>
                                            </div>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </div>

                    {/* Selected User Preview */}
                    {selectedUser && (
                        <div style={{
                            backgroundColor: '#f6f8fa',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 20,
                            border: '1px solid #e1e4e8'
                        }}>
                            <Row gutter={16} align="middle">
                                <Col>
                                    <Avatar size={48} style={{ backgroundColor: '#722ed1' }}>
                                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                                    </Avatar>
                                </Col>
                                <Col flex={1}>
                                    <Text strong style={{ fontSize: 16 }}>
                                        {selectedUser.firstName} {selectedUser.lastName}
                                    </Text>
                                    <br />
                                    <Text type="secondary">{selectedUser.email}</Text>
                                    {selectedUser.userName && (
                                        <Text type="secondary"> • @{selectedUser.userName}</Text>
                                    )}
                                </Col>
                                <Col>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text type="secondary">Earnings</Text>
                                        <br />
                                        <Text strong style={{ fontSize: 18, color: '#722ed1' }}>
                                            ${(selectedUser.earning || 0).toFixed(2)}
                                        </Text>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {/* Info Box */}
                    <div style={{
                        backgroundColor: '#f0f5ff',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 20,
                        border: '1px solid #adc6ff'
                    }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            <FiMail style={{ marginRight: 8 }} />
                            The selected user will receive:
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li>An in-app notification</li>
                                <li>An email invitation with a link to claim their Collab Card</li>
                            </ul>
                        </Text>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button
                            onClick={() => {
                                setShowCollabCardModal(false);
                                setSelectedUserId('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            icon={<FiSend />}
                            onClick={handleSendCollabCardInvitation}
                            loading={collabCardLoading}
                            disabled={!selectedUserId || collabCardLoading}
                            style={{
                                backgroundColor: '#722ed1',
                                borderColor: '#722ed1',
                                color: 'white',
                            }}
                        >
                            Send Invitation
                        </Button>
                    </div>
                </div>
            </Modal>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#262626', display: 'flex', alignItems: 'center' }}>
                        <FiZap style={{ marginRight: '12px', color: '#1890ff' }} />
                        Admin Shortcuts
                    </span>
                </div>

                {/* Main Section */}
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <FiUserCheck style={{ marginRight: '8px', color: '#1890ff' }} />
                                User Management
                            </span>
                            <Button
                                icon={<FiRefreshCw />}
                                onClick={handleFetchProfiles}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                        </div>
                    }
                    style={{ marginBottom: '32px' }}
                >
                    <Table
                        columns={visionaryColumns}
                        dataSource={visionaryApplications}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} users`,
                        }}
                        scroll={{ x: 1200 }}
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                                    <span style={{ display: "block", marginBottom: '12px' }}>User Details</span>
                                    <Row gutter={[16, 8]}>
                                        <Col span={8}><strong>User ID:</strong> {record.userId}</Col>
                                        <Col span={8}><strong>Email:</strong> {record.email}</Col>
                                    </Row>
                                </div>
                            ),
                        }}
                    />
                </Card>

                {/* Special Invitations */}
                <Card
                    title={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <FiGift style={{ marginRight: '8px', color: '#722ed1' }} />
                            Collab Card Invitation Management
                        </span>
                    }
                >
                    <Row gutter={[24, 16]} align="middle">
                        <Col xs={24} lg={16}>
                            <div>
                                <h3 style={{ marginBottom: '8px' }}>Trigger Collab Card Eligibility Invitations</h3>
                                <p style={{ color: '#8c8c8c', marginBottom: '16px' }}>
                                    Send targeted invitations to eligible users for the Collab Card program based on activity, engagement, and platform contributions
                                </p>
                                <Space wrap>
                                    <Tag color="purple">Premium Feature</Tag>
                                    <Tag color="blue">Automated Targeting</Tag>
                                    <Tag color="green">Custom Messaging</Tag>
                                </Space>
                            </div>
                        </Col>
                        <Col xs={24} lg={8} style={{ textAlign: 'center' }}>
                            <Button
                                type="primary"
                                icon={<FiGift />}
                                size="large"
                                style={{ minWidth: '200px', backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                onClick={openCollabCardModal}
                                loading={collabCardLoading}
                            >
                                Configure & Send Invitations
                            </Button>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    )
}

export default AdminShortcuts;