'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Progress, Tag } from 'antd';
import { EyeOutlined, LineChartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppSelector } from '@/store';
import { Ad } from '@/types/adTypes';
import { fetchUserAdStats, calculateAdMetrics, fetchAdImpressionsOverTime } from '@/utils/adUtils';
import dayjs from 'dayjs';
import styles from './styles.module.css';
import { AdImpressionChart } from './AdImpressionChart';

const { Title, Paragraph, Text } = Typography;

interface AdAnalytic extends Ad {
    daysRemaining: number;
    avgImpressionsPerDay: number;
}

const AdAnalytics = () => {
    const profile = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState<any>(null);
    const [ads, setAds] = useState<AdAnalytic[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<{ date: string; impressions: number }[]>([]);
    const [chartLoading, setChartLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setChartLoading(true);

            // Fetch stats
            const userStats = await fetchUserAdStats(profile.profileId!);
            setStats(userStats);

            // Fetch chart data
            const impressionsData = await fetchAdImpressionsOverTime(profile.profileId!);
            setChartData(impressionsData);
            setChartLoading(false);

            // Fetch ads
            const response = await fetch(`/api/ads/upload?advertiser_id=${profile.profileId}`);
            const result = await response.json();

            if (result.success) {
                const adsWithAnalytics = result.ads.map((ad: Ad) => {
                    const createdDate = dayjs(ad.created_at);
                    const expiryDate = createdDate.add(30, 'days');
                    const now = dayjs();
                    const daysRemaining = expiryDate.diff(now, 'days');
                    const daysPassed = now.diff(createdDate, 'days') || 1;
                    const avgImpressionsPerDay = Math.round(ad.impressions_count / daysPassed);

                    return {
                        ...ad,
                        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
                        avgImpressionsPerDay
                    };
                });

                setAds(adsWithAnalytics);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageImpressions = () => {
        if (ads.length === 0) return 0;
        const activeAds = ads.filter(ad => ad.status === 'active');
        if (activeAds.length === 0) return 0;
        const totalImpressions = activeAds.reduce((sum, ad) => sum + ad.impressions_count, 0);
        return Math.round(totalImpressions / activeAds.length);
    };

    const columns: ColumnsType<AdAnalytic> = [
        {
            title: 'Ad Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Created: {dayjs(record.created_at).format('MMM DD, YYYY')}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors: { [key: string]: string } = {
                    active: 'green',
                    pending: 'gold',
                    rejected: 'red',
                    expired: 'default'
                };
                return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Total Impressions',
            dataIndex: 'impressions_count',
            key: 'impressions',
            render: (count, record) => {
                const metrics = calculateAdMetrics(record);
                const roundedPercentage = Math.round(metrics.impressionPercentage * 100) / 100;
                return (
                    <div>
                        <div style={{ marginBottom: 4 }}>
                            <Text>{count} / 2000</Text>
                        </div>
                        <Progress
                            percent={roundedPercentage}
                            size="small"
                            status={roundedPercentage >= 100 ? 'success' : 'active'}
                        />
                    </div>
                );
            },
            sorter: (a, b) => a.impressions_count - b.impressions_count,
        },
        {
            title: 'Avg per Day',
            dataIndex: 'avgImpressionsPerDay',
            key: 'avgPerDay',
            render: (avg) => <Text>{avg}</Text>,
            sorter: (a, b) => a.avgImpressionsPerDay - b.avgImpressionsPerDay,
        },
        {
            title: 'Days Remaining',
            dataIndex: 'daysRemaining',
            key: 'daysRemaining',
            render: (days, record) => {
                if (record.status === 'pending') {
                    return <Tag color="gold">Pending Approval</Tag>;
                }
                if (record.status === 'expired') {
                    return <Tag color="default">Expired</Tag>;
                }
                if (record.status === 'rejected') {
                    return <Tag color="red">Rejected</Tag>;
                }
                if (record.status !== 'active') {
                    return <Text type="secondary">N/A</Text>;
                }

                const color = days <= 5 ? 'red' : days <= 15 ? 'orange' : 'green';
                return (
                    <Text style={{ color }}>
                        <ClockCircleOutlined /> {days} days
                    </Text>
                );
            },
            sorter: (a, b) => a.daysRemaining - b.daysRemaining,
        },
    ];

    return (
        <div className={styles.analyticsContainer}>
            <div className={styles.header}>
                <Title level={2}>Ad Analytics</Title>
                <Paragraph>Track the performance of your advertising campaigns</Paragraph>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Impressions (Replay)"
                            value={stats?.totalImpressions || 0}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card loading={loading}>
                        <Statistic
                            title="Average Impressions Per Ad"
                            value={calculateAverageImpressions()}
                            prefix={<LineChartOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card loading={loading}>
                        <Statistic
                            title="Active Ads"
                            value={ads.filter(ad => ad.status === 'active').length}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                title="Impressions Over Time (Last 30 Days)"
                className={styles.chartCard}
                style={{ marginBottom: 24 }}
                loading={chartLoading}
            >
                {!chartLoading && chartData.length > 0 ? (
                    <AdImpressionChart data={chartData} />
                ) : !chartLoading ? (
                    <div className={styles.chartPlaceholder}>
                        <LineChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                        <Paragraph type="secondary" style={{ marginTop: 16 }}>
                            No impression data available yet. Your chart will appear here once your ads start getting views.
                        </Paragraph>
                    </div>
                ) : null}
            </Card>

            <Card title="Ad Performance Details">
                <Table
                    columns={columns}
                    scroll={{ x: 1000 }}
                    dataSource={ads}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="Performance Tips">
                        <ul className={styles.tipsList}>
                            <li>Ads typically perform better in the first 10 days</li>
                            <li>Consider refreshing your ad if impressions plateau</li>
                            <li>Monitor days remaining to plan your next campaign</li>
                            <li>Active ads get priority placement in room lobbies</li>
                        </ul>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Key Metrics Explained">
                        <div className={styles.metricsExplanation}>
                            <Paragraph>
                                <Text strong>Total Impressions:</Text> Number of times your ad has been viewed in replays
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Avg per Day:</Text> Average daily impressions since ad went live
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Days Remaining:</Text> Time until ad reaches 30-day expiry (or 2000 impressions)
                            </Paragraph>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdAnalytics;