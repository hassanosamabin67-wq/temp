"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Statistic, Row, Col, Typography, Spin } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import dayjs from 'dayjs';
import { useNotification } from '@/Components/custom/custom-notification';
import styles from './styles.module.css'

const { Title, Text } = Typography;

interface SubscriptionRoom {
    room_id: string;
    title: string;
    subscription_price: number;
    total_subscribers: number;
    active_subscribers: number;
    subscription_active: boolean;
    subscription_created_at: string;
}

interface SubscriptionAnalytics {
    month_year: string;
    total_subscribers: number;
    new_subscribers: number;
    gross_revenue: number;
    platform_fees: number;
    host_payout: number;
}

const SubscriptionManagement: React.FC = () => {
    const [subscriptionRooms, setSubscriptionRooms] = useState<SubscriptionRoom[]>([]);
    const [analytics, setAnalytics] = useState<SubscriptionAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalStats, setTotalStats] = useState({
        totalRevenue: 0,
        totalSubscribers: 0,
        activeRooms: 0,
        monthlyPayout: 0
    });

    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();

    useEffect(() => {
        if (profile.profileId) {
            fetchSubscriptionData();
        }
    }, [profile.profileId]);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);

            // Fetch subscription rooms
            const { data: rooms, error: roomsError } = await supabase
                .from('subscription_room_details')
                .select('*')
                .eq('host', profile.profileId);

            if (roomsError) {
                console.error('Error fetching subscription rooms:', roomsError);
                notify({ type: "error", message: 'Failed to load subscription rooms' });
                return;
            }

            setSubscriptionRooms(rooms || []);

            // Fetch analytics for current month
            const currentMonth = dayjs().format('YYYY-MM');
            const { data: analyticsData, error: analyticsError } = await supabase
                .from('subscription_analytics')
                .select('*')
                .eq('host_id', profile.profileId)
                .order('month_year', { ascending: false })
                .limit(6);

            if (analyticsError) {
                console.error('Error fetching analytics:', analyticsError);
                notify({ type: "error", message: 'Failed to load analytics' });
                return
            } else {
                setAnalytics(analyticsData || []);
            }

            // Calculate total stats
            const totalRevenue = (analyticsData || []).reduce((sum, item) => sum + (item.gross_revenue || 0), 0);
            const totalSubscribers = (rooms || []).reduce((sum, room) => sum + (room.active_subscribers || 0), 0);
            const activeRooms = (rooms || []).filter(room => room.subscription_active).length;
            const currentMonthData = (analyticsData || []).find(item => item.month_year === currentMonth);
            const monthlyPayout = currentMonthData?.host_payout || 0;

            setTotalStats({
                totalRevenue,
                totalSubscribers,
                activeRooms,
                monthlyPayout
            });

        } catch (error) {
            console.error('Error fetching subscription data:', error);
            notify({ type: "error", message: 'Failed to load subscription data' });
        } finally {
            setLoading(false);
        }
    };

    const roomColumns = [
        {
            title: 'Room Title',
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => <Text strong>{title}</Text>
        },
        {
            title: 'Monthly Price',
            dataIndex: 'subscription_price',
            key: 'subscription_price',
            render: (price: number) => `$${price}/month`
        },
        {
            title: 'Active Subscribers',
            dataIndex: 'active_subscribers',
            key: 'active_subscribers',
            render: (count: number) => (
                <Tag color={count > 0 ? 'green' : 'default'}>
                    {count} subscribers
                </Tag>
            )
        },
        {
            title: 'Monthly Revenue',
            key: 'monthly_revenue',
            render: (record: SubscriptionRoom) => {
                const revenue = record.active_subscribers * record.subscription_price;
                const payout = revenue * 0.8; // 80% after platform fee
                return (
                    <div>
                        <div>${revenue} gross</div>
                        <Text type="secondary">${payout} payout</Text>
                    </div>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'subscription_active',
            key: 'status',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Created',
            dataIndex: 'subscription_created_at',
            key: 'created',
            render: (date: string) => dayjs(date).format('MMM D, YYYY')
        }
    ];

    const analyticsColumns = [
        {
            title: 'Month',
            dataIndex: 'month_year',
            key: 'month_year',
            render: (monthYear: string) => dayjs(monthYear + '-01').format('MMMM YYYY')
        },
        {
            title: 'New Subscribers',
            dataIndex: 'new_subscribers',
            key: 'new_subscribers'
        },
        {
            title: 'Total Subscribers',
            dataIndex: 'total_subscribers',
            key: 'total_subscribers'
        },
        {
            title: 'Gross Revenue',
            dataIndex: 'gross_revenue',
            key: 'gross_revenue',
            render: (amount: number) => `$${amount.toFixed(2)}`
        },
        {
            title: 'Platform Fees',
            dataIndex: 'platform_fees',
            key: 'platform_fees',
            render: (amount: number) => `$${amount.toFixed(2)}`
        },
        {
            title: 'Your Payout',
            dataIndex: 'host_payout',
            key: 'host_payout',
            render: (amount: number) => (
                <Text strong style={{ color: '#52c41a' }}>
                    ${amount.toFixed(2)}
                </Text>
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

    return (
        <div className={styles.subscriptionMain}>
            <Title level={2}>Subscription Management</Title>

            {/* Stats Overview */}
            <div className={styles.subscriptionStats}>
                <Card>
                    <Statistic
                        title="Total Revenue"
                        value={totalStats.totalRevenue}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Active Subscribers"
                        value={totalStats.totalSubscribers}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Active Rooms"
                        value={totalStats.activeRooms}
                        valueStyle={{ color: '#722ed1' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="This Month Payout"
                        value={totalStats.monthlyPayout}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Card>
            </div>

            {/* Subscription Rooms */}
            <Card
                title="Your Subscription Rooms"
                style={{ marginBottom: 24 }}
                extra={
                    <Button
                        type="primary"
                        onClick={() => window.location.href = '/think-tank'}
                    >
                        Create New Room
                    </Button>
                }
            >
                <Table
                    dataSource={subscriptionRooms}
                    columns={roomColumns}
                    scroll={{ x: 900 }}
                    rowKey="room_id"
                    pagination={false}
                    locale={{
                        emptyText: 'No subscription rooms found. Create your first subscription room to start earning recurring revenue!'
                    }}
                />
            </Card>

            {/* Analytics */}
            <Card title="Monthly Analytics">
                <Table
                    dataSource={analytics}
                    columns={analyticsColumns}
                    scroll={{ x: 900 }}
                    rowKey="month_year"
                    pagination={false}
                    locale={{
                        emptyText: 'No analytics data available yet.'
                    }}
                />
            </Card>

            {/* Info Box */}
            <Card style={{ marginTop: 24, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <Title level={4} style={{ color: '#0369a1', marginBottom: 16 }}>
                    💡 How Subscription Rooms Work
                </Title>
                <ul style={{ color: '#0369a1', margin: 0, paddingLeft: 20 }}>
                    <li>Set your monthly subscription price (minimum $5/month)</li>
                    <li>Subscribers get unlimited access to your room</li>
                    <li>Automatic billing handled by Stripe</li>
                    <li>You receive 80% of subscription revenue</li>
                    <li>Kaboom takes 20% platform fee</li>
                    <li>Monthly payouts via Stripe Connect</li>
                </ul>
            </Card>
        </div>
    );
};

export default SubscriptionManagement;
