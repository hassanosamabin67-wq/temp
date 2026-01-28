import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Statistic, Row, Col, Alert, Spin, Typography } from 'antd';
import { ReloadOutlined, MailOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import dayjs from 'dayjs';

const { Title } = Typography;

const CollabCardInvitations = () => {
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const { notify } = useNotification();

    const fetchInvitations = async () => {
        try {
            setLoading(true);
            
            // Fetch recent invitations
            const { data: invitationsData, error: invitationsError } = await supabase
                .from('collab_card_invitations')
                .select(`
                    id,
                    user_id,
                    earnings_at_invitation,
                    invitation_date,
                    accepted_date,
                    status,
                    email_sent,
                    users!inner(
                        email,
                        firstName,
                        lastName,
                        userName
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (invitationsError) {
                console.error('Error fetching invitations:', invitationsError);
                notify({ type: 'error', message: 'Failed to fetch invitations' });
                return;
            }

            setInvitations(invitationsData || []);

            // Fetch statistics
            const { data: statsData, error: statsError } = await supabase
                .from('collab_card_invitation_stats')
                .select('*')
                .single();

            if (statsError) {
                console.error('Error fetching stats:', statsError);
            } else {
                setStats(statsData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            notify({ type: 'error', message: 'Failed to fetch data' });
        } finally {
            setLoading(false);
        }
    };

    const processPendingInvitations = async () => {
        try {
            setProcessing(true);
            
            const response = await fetch('/api/collab-card/process-invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (response.ok) {
                notify({ 
                    type: 'success', 
                    message: `Processed ${result.processed} invitations: ${result.successful} successful, ${result.failed} failed` 
                });
                fetchInvitations(); // Refresh data
            } else {
                notify({ type: 'error', message: result.error || 'Failed to process invitations' });
            }

        } catch (error) {
            console.error('Error processing invitations:', error);
            notify({ type: 'error', message: 'Failed to process invitations' });
        } finally {
            setProcessing(false);
        }
    };

    const expireOldInvitations = async () => {
        try {
            setProcessing(true);
            
            const response = await fetch('/api/cron/expire-invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (response.ok) {
                notify({ 
                    type: 'success', 
                    message: `Expired ${result.expiredCount} old invitations` 
                });
                fetchInvitations(); // Refresh data
            } else {
                notify({ type: 'error', message: result.error || 'Failed to expire invitations' });
            }

        } catch (error) {
            console.error('Error expiring invitations:', error);
            notify({ type: 'error', message: 'Failed to expire invitations' });
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'blue';
            case 'accepted': return 'green';
            case 'expired': return 'orange';
            case 'failed': return 'red';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <MailOutlined />;
            case 'accepted': return <CheckCircleOutlined />;
            case 'expired': return <ClockCircleOutlined />;
            case 'failed': return <CloseCircleOutlined />;
            default: return null;
        }
    };

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (record: any) => (
                <div>
                    <div>{record.users.firstName} {record.users.lastName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.users.email}</div>
                </div>
            ),
        },
        {
            title: 'Earnings',
            dataIndex: 'earnings_at_invitation',
            key: 'earnings',
            render: (earnings: number) => `$${earnings.toFixed(2)}`,
        },
        {
            title: 'Invitation Date',
            dataIndex: 'invitation_date',
            key: 'invitation_date',
            render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: any) => (
                <Space>
                    <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
                        {status.toUpperCase()}
                    </Tag>
                    {record.email_sent && <Tag color="green">Email Sent</Tag>}
                </Space>
            ),
        },
        {
            title: 'Accepted Date',
            dataIndex: 'accepted_date',
            key: 'accepted_date',
            render: (date: string) => date ? dayjs(date).format('MMM DD, YYYY HH:mm') : '-',
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={2}>Collab Card Invitations</Title>
            
            {/* Statistics Cards */}
            {stats && (
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Total Invitations"
                                value={stats.total_invitations}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Pending"
                                value={stats.pending_invitations}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Accepted"
                                value={stats.accepted_invitations}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Expired"
                                value={stats.expired_invitations}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Action Buttons */}
            <Card style={{ marginBottom: '24px' }}>
                <Space>
                    <Button 
                        type="primary" 
                        icon={<MailOutlined />}
                        onClick={processPendingInvitations}
                        loading={processing}
                    >
                        Process Pending Invitations
                    </Button>
                    <Button 
                        icon={<ClockCircleOutlined />}
                        onClick={expireOldInvitations}
                        loading={processing}
                    >
                        Expire Old Invitations
                    </Button>
                    <Button 
                        icon={<ReloadOutlined />}
                        onClick={fetchInvitations}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </Space>
            </Card>

            {/* Invitations Table */}
            <Card title="Recent Invitations">
                <Table
                    columns={columns}
                    dataSource={invitations}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invitations`,
                    }}
                />
            </Card>

            {/* Information Alert */}
            <Alert
                message="Collab Card Invitation System"
                description="This system automatically sends invitations to users when they reach $500 in earnings. Invitations expire after 30 days if not accepted. Use the 'Process Pending Invitations' button to send emails for invitations that haven't been sent yet."
                type="info"
                showIcon
                style={{ marginTop: '24px' }}
            />
        </div>
    );
};

export default CollabCardInvitations; 