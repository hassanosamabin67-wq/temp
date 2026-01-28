"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Statistic, Row, Col, Typography, Spin, message, DatePicker, Select } from 'antd';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SubscriptionOverview {
    total_rooms: number;
    active_rooms: number;
    total_subscribers: number;
    total_revenue: number;
    platform_fees: number;
    host_payouts: number;
}

interface MonthlyAnalytics {
    month_year: string;
    total_subscribers: number;
    new_subscribers: number;
    gross_revenue: number;
    platform_fees: number;
    host_payout: number;
    room_count: number;
}

interface TopRoom {
    room_id: string;
    title: string;
    host_name: string;
    subscription_price: number;
    active_subscribers: number;
    monthly_revenue: number;
    platform_fees: number;
}

const SubscriptionAnalytics: React.FC = () => {
    const [overview, setOverview] = useState<SubscriptionOverview>({
        total_rooms: 0,
        active_rooms: 0,
        total_subscribers: 0,
        total_revenue: 0,
        platform_fees: 0,
        host_payouts: 0
    });
    const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics[]>([]);
    const [topRooms, setTopRooms] = useState<TopRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().subtract(11, 'months').startOf('month'),
        dayjs().endOf('month')
    ]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch overview data
            const { data: rooms, error: roomsError } = await supabase
                .from('subscription_room_details')
                .select('*');

            if (roomsError) {
                console.error('Error fetching rooms:', roomsError);
                message.error('Failed to load subscription rooms data');
                return;
            }

            // Calculate overview stats
            const totalRooms = rooms?.length || 0;
            const activeRooms = rooms?.filter(room => room.subscription_active).length || 0;
            const totalSubscribers = rooms?.reduce((sum, room) => sum + (room.active_subscribers || 0), 0) || 0;

            // Fetch monthly analytics
            const startMonth = dateRange[0].format('YYYY-MM');
            const endMonth = dateRange[1].format('YYYY-MM');

            const { data: analytics, error: analyticsError } = await supabase
                .from('subscription_analytics')
                .select('*')
                .gte('month_year', startMonth)
                .lte('month_year', endMonth)
                .order('month_year', { ascending: false });

            if (analyticsError) {
                console.error('Error fetching analytics:', analyticsError);
                message.error('Failed to load analytics data');
                return;
            }

            // Aggregate monthly data
            const monthlyMap = new Map<string, MonthlyAnalytics>();
            (analytics || []).forEach(item => {
                const existing = monthlyMap.get(item.month_year) || {
                    month_year: item.month_year,
                    total_subscribers: 0,
                    new_subscribers: 0,
                    gross_revenue: 0,
                    platform_fees: 0,
                    host_payout: 0,
                    room_count: 0
                };

                existing.total_subscribers += item.total_subscribers || 0;
                existing.new_subscribers += item.new_subscribers || 0;
                existing.gross_revenue += item.gross_revenue || 0;
                existing.platform_fees += item.platform_fees || 0;
                existing.host_payout += item.host_payout || 0;
                existing.room_count += 1;

                monthlyMap.set(item.month_year, existing);
            });

            const monthlyAnalytics = Array.from(monthlyMap.values())
                .sort((a, b) => b.month_year.localeCompare(a.month_year));

            setMonthlyData(monthlyAnalytics);

            // Calculate total revenue and fees
            const totalRevenue = monthlyAnalytics.reduce((sum, month) => sum + month.gross_revenue, 0);
            const platformFees = monthlyAnalytics.reduce((sum, month) => sum + month.platform_fees, 0);
            const hostPayouts = monthlyAnalytics.reduce((sum, month) => sum + month.host_payout, 0);

            setOverview({
                total_rooms: totalRooms,
                active_rooms: activeRooms,
                total_subscribers: totalSubscribers,
                total_revenue: totalRevenue,
                platform_fees: platformFees,
                host_payouts: hostPayouts
            });

            // Prepare top rooms data
            const topRoomsData = (rooms || [])
                .map(room => ({
                    room_id: room.room_id,
                    title: room.title,
                    host_name: room.host_name,
                    subscription_price: room.subscription_price,
                    active_subscribers: room.active_subscribers,
                    monthly_revenue: room.active_subscribers * room.subscription_price,
                    platform_fees: room.active_subscribers * room.subscription_price * 0.2
                }))
                .sort((a, b) => b.monthly_revenue - a.monthly_revenue)
                .slice(0, 10);

            setTopRooms(topRoomsData);

        } catch (error) {
            console.error('Error fetching analytics:', error);
            message.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const monthlyColumns = [
        {
            title: 'Month',
            dataIndex: 'month_year',
            key: 'month_year',
            render: (monthYear: string) => dayjs(monthYear + '-01').format('MMMM YYYY')
        },
        {
            title: 'Active Rooms',
            dataIndex: 'room_count',
            key: 'room_count'
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
            title: 'Platform Fees (20%)',
            dataIndex: 'platform_fees',
            key: 'platform_fees',
            render: (amount: number) => (
                <Text strong style={{ color: '#52c41a' }}>
                    ${amount.toFixed(2)}
                </Text>
            )
        },
        {
            title: 'Host Payouts (80%)',
            dataIndex: 'host_payout',
            key: 'host_payout',
            render: (amount: number) => `$${amount.toFixed(2)}`
        }
    ];

    const topRoomsColumns = [
        {
            title: 'Room Title',
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => <Text strong>{title}</Text>
        },
        {
            title: 'Host',
            dataIndex: 'host_name',
            key: 'host_name'
        },
        {
            title: 'Price',
            dataIndex: 'subscription_price',
            key: 'subscription_price',
            render: (price: number) => `$${price}/month`
        },
        {
            title: 'Subscribers',
            dataIndex: 'active_subscribers',
            key: 'active_subscribers'
        },
        {
            title: 'Monthly Revenue',
            dataIndex: 'monthly_revenue',
            key: 'monthly_revenue',
            render: (amount: number) => `$${amount.toFixed(2)}`
        },
        {
            title: 'Platform Fees',
            dataIndex: 'platform_fees',
            key: 'platform_fees',
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
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2}>Subscription Analytics</Title>
                <RangePicker
                    picker="month"
                    value={dateRange}
                    onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                            setDateRange([dates[0], dates[1]]);
                        }
                    }}
                />
            </div>
            
            {/* Overview Stats */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={4}>
                    <Card>
                        <Statistic
                            title="Total Rooms"
                            value={overview.total_rooms}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card>
                        <Statistic
                            title="Active Rooms"
                            value={overview.active_rooms}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card>
                        <Statistic
                            title="Total Subscribers"
                            value={overview.total_subscribers}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card>
                        <Statistic
                            title="Total Revenue"
                            value={overview.total_revenue}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card>
                        <Statistic
                            title="Platform Fees"
                            value={overview.platform_fees}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card>
                        <Statistic
                            title="Host Payouts"
                            value={overview.host_payouts}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#13c2c2' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Monthly Analytics */}
            <Card title="Monthly Performance" style={{ marginBottom: 24 }}>
                <Table
                    dataSource={monthlyData}
                    columns={monthlyColumns}
                    rowKey="month_year"
                    pagination={false}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Top Performing Rooms */}
            <Card title="Top Performing Subscription Rooms">
                <Table
                    dataSource={topRooms}
                    columns={topRoomsColumns}
                    rowKey="room_id"
                    pagination={false}
                    locale={{
                        emptyText: 'No subscription rooms found.'
                    }}
                />
            </Card>

            {/* Platform Info */}
            <Card style={{ marginTop: 24, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <Title level={4} style={{ color: '#0369a1', marginBottom: 16 }}>
                    📊 Subscription Model Overview
                </Title>
                <Row gutter={16}>
                    <Col span={12}>
                        <ul style={{ color: '#0369a1', margin: 0, paddingLeft: 20 }}>
                            <li>20% platform fee on all subscriptions</li>
                            <li>80% goes to content creators</li>
                            <li>Automatic monthly billing via Stripe</li>
                            <li>Real-time analytics and reporting</li>
                        </ul>
                    </Col>
                    <Col span={12}>
                        <ul style={{ color: '#0369a1', margin: 0, paddingLeft: 20 }}>
                            <li>Minimum subscription price: $5/month</li>
                            <li>Instant access management</li>
                            <li>Subscriber retention tracking</li>
                            <li>Monthly payout processing</li>
                        </ul>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default SubscriptionAnalytics;
