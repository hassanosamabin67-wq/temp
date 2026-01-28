"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Typography, Spin, Modal, Image } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import dayjs from 'dayjs';
import { useNotification } from '@/Components/custom/custom-notification';
import styles from './style.module.css'

const { Title, Text } = Typography;

interface UserSubscription {
    subscription_id: string;
    room_id: string;
    room_title: string;
    room_description: string;
    room_type: string;
    host_name: string;
    host_image: string;
    subscription_price: number;
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    subscribed_at: string;
}

const MySubscriptions: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const { notify } = useNotification();
    const profile = useAppSelector((state) => state.auth);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);

    const openCancelModal = (subscription: UserSubscription) => {
        setSelectedSubscription(subscription);
        setShowCancelModal(true);
    };

    const cancelSubscription = async () => {
        if (!selectedSubscription) return;
        try {
            setCancelingId(selectedSubscription.subscription_id);

            const response = await fetch('/api/subscriptions/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: selectedSubscription.subscription_id,
                    cancelAtPeriodEnd: true
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to cancel subscription');

            notify({ type: "success", message: 'Subscription canceled successfully. You\'ll keep access until the end of your billing period.' });
            fetchSubscriptions();
        } catch (error) {
            console.error(error);
            notify({ type: "error", message: 'Failed to cancel subscription. Please try again.' });
        } finally {
            setCancelingId(null);
            setShowCancelModal(false);
            setSelectedSubscription(null);
        }
    };

    useEffect(() => {
        if (profile.profileId) {
            fetchSubscriptions();
        }
    }, [profile.profileId]);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('user_subscription_details')
                .select('*')
                .eq('subscriber_id', profile.profileId)
                .order('subscribed_at', { ascending: false });

            if (error) {
                console.error('Error fetching subscriptions:', error);
                notify({ type: "error", message: 'Failed to load subscriptions' });
                return;
            }

            setSubscriptions(data || []);

        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            notify({ type: "error", message: 'Failed to load subscriptions' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string, cancelAtPeriodEnd: boolean) => {
        if (cancelAtPeriodEnd) return 'orange';
        switch (status) {
            case 'active': return 'green';
            case 'past_due': return 'red';
            case 'canceled': return 'default';
            default: return 'blue';
        }
    };

    const getStatusText = (status: string, cancelAtPeriodEnd: boolean, currentPeriodEnd: string) => {
        if (cancelAtPeriodEnd) {
            return `Canceling on ${dayjs(currentPeriodEnd).format('MMM D, YYYY')}`;
        }
        switch (status) {
            case 'active': return 'Active';
            case 'past_due': return 'Payment Failed';
            case 'canceled': return 'Canceled';
            default: return status;
        }
    };

    const columns = [
        {
            title: 'Room',
            key: 'room',
            render: (record: UserSubscription) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {record.host_image && (
                        <Image
                            src={record.host_image}
                            alt={record.host_name}
                            width={40}
                            height={40}
                            style={{ borderRadius: '50%' }}
                            preview={false}
                        />
                    )}
                    <div>
                        <Text strong>{record.room_title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            by {record.host_name}
                        </Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Type',
            dataIndex: 'room_type',
            key: 'room_type',
            render: (type: string) => (
                <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
            )
        },
        {
            title: 'Price',
            dataIndex: 'subscription_price',
            key: 'price',
            render: (price: number) => `$${price}/month`
        },
        {
            title: 'Status',
            key: 'status',
            render: (record: UserSubscription) => (
                <Tag color={getStatusColor(record.status, record.cancel_at_period_end)}>
                    {getStatusText(record.status, record.cancel_at_period_end, record.current_period_end)}
                </Tag>
            )
        },
        {
            title: 'Current Period',
            key: 'period',
            render: (record: UserSubscription) => (
                <div>
                    <div>{dayjs(record.current_period_start).format('MMM D')} - {dayjs(record.current_period_end).format('MMM D, YYYY')}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Renews {dayjs(record.current_period_end).format('MMM D')}
                    </Text>
                </div>
            )
        },
        {
            title: 'Subscribed',
            dataIndex: 'subscribed_at',
            key: 'subscribed_at',
            render: (date: string) => dayjs(date).format('MMM D, YYYY')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: UserSubscription) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => window.open(`/think-tank/room/${record.room_id}`, '_blank')}
                    >
                        Enter Room
                    </Button>
                    {record.status === 'active' && !record.cancel_at_period_end && (
                        <Button
                            danger
                            size="small"
                            loading={cancelingId === record.subscription_id}
                            onClick={() => openCancelModal(record)}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Spin size="large" />
            </div>
        );
    }

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active' && !sub.cancel_at_period_end);
    const totalMonthlySpend = activeSubscriptions.reduce((sum, sub) => sum + sub.subscription_price, 0);

    return (
        <div className={styles.mySubscriptionMain}>
            <Title level={2}>My Subscriptions</Title>

            {/* Summary */}
            <Card style={{ marginBottom: 24 }}>
                <div className={styles.mySubscriptionStats}>
                    <div>
                        <Text type="secondary">Active Subscriptions</Text>
                        <Title level={3} style={{ margin: 0 }}>{activeSubscriptions.length}</Title>
                    </div>
                    <div>
                        <Text type="secondary">Monthly Spend</Text>
                        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>${totalMonthlySpend}/month</Title>
                    </div>
                    <Button
                        type="primary"
                        onClick={() => window.location.href = '/think-tank'}
                    >
                        Browse Rooms
                    </Button>
                </div>
            </Card>

            {/* Subscriptions Table */}
            <Card title="All Subscriptions">
                <Table
                    dataSource={subscriptions}
                    columns={columns}
                    scroll={{ x: 900 }}
                    rowKey="subscription_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: 40, textAlign: 'center' }}>
                                <Title level={4} type="secondary">No subscriptions yet</Title>
                                <Text type="secondary">
                                    Subscribe to Collab Rooms to get unlimited access to exclusive content and sessions.
                                </Text>
                                <br />
                                <Button
                                    type="primary"
                                    style={{ marginTop: 16 }}
                                    onClick={() => window.location.href = '/think-tank'}
                                >
                                    Browse Subscription Rooms
                                </Button>
                            </div>
                        )
                    }}
                />
            </Card>

            {/* Info */}
            <Card style={{ marginTop: 24, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Title level={4} style={{ color: '#389e0d', marginBottom: 16 }}>
                    💡 Subscription Benefits
                </Title>
                <ul style={{ color: '#389e0d', margin: 0, paddingLeft: 20 }}>
                    <li>Unlimited access to subscribed rooms</li>
                    <li>Exclusive content and sessions</li>
                    <li>Direct interaction with visionaries</li>
                    <li>Cancel anytime (access continues until period end)</li>
                    <li>Automatic billing - no need to remember payments</li>
                </ul>
            </Card>

            <Modal
                open={showCancelModal}
                title="Cancel Subscription"
                onOk={cancelSubscription}
                onCancel={() => setShowCancelModal(false)}
                centered
                okText="Yes, Cancel Subscription"
                okButtonProps={{ danger: true, loading: cancelingId === selectedSubscription?.subscription_id }}
                cancelText="Keep Subscription"
            >
                {selectedSubscription && (
                    <div>
                        <p>
                            Are you sure you want to cancel your subscription to
                            <strong> {selectedSubscription.room_title}</strong>?
                        </p>
                        <p>
                            You'll keep access until
                            <strong> {dayjs(selectedSubscription.current_period_end).format('MMMM D, YYYY')}</strong>.
                        </p>
                        <p style={{ color: '#ff4d4f' }}>This action cannot be undone.</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MySubscriptions;