'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Typography } from 'antd';
import {
    DollarOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    PlusCircleOutlined,
    UnorderedListOutlined,
    CreditCardOutlined
} from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { fetchUserAdStats } from '@/utils/adUtils';
import styles from './styles.module.css';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title, Paragraph } = Typography;

interface OverviewProps {
    onNavigate: (key: 'overview' | 'my-ads' | 'upload' | 'analytics' | 'guidelines' | 'billing') => void;
}

const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
    const profile = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const userStats = await fetchUserAdStats(profile.profileId!);
            setStats(userStats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overviewContainer}>
            <div className={styles.header}>
                <Title level={2}>Dashboard Overview</Title>
                <Paragraph>Welcome back! Here's a summary of your advertising campaigns.</Paragraph>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Ads Purchased"
                            value={stats?.totalAds || 0}
                            prefix={<PlayCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Active Ads"
                            value={stats?.activeAds || 0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Impressions"
                            value={stats?.totalImpressions || 0}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Spent"
                            value={stats?.totalSpent || 0}
                            prefix={<DollarOutlined />}
                            precision={2}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Quick Actions" className={styles.quickActionsCard}>
                <Space size="large" wrap>
                    <ActionButton
                        size="large"
                        icon={<PlusCircleOutlined />}
                        onClick={() => onNavigate('upload')}
                    >
                        Upload New Ad
                    </ActionButton>
                    <Button
                        size="large"
                        icon={<UnorderedListOutlined />}
                        onClick={() => onNavigate('my-ads')}
                    >
                        View My Ads
                    </Button>
                    <Button
                        size="large"
                        icon={<EyeOutlined />}
                        onClick={() => onNavigate('analytics')}
                    >
                        View Analytics
                    </Button>
                    <Button
                        size="large"
                        icon={<CreditCardOutlined />}
                        onClick={() => onNavigate('billing')}
                    >
                        Billing & Invoices
                    </Button>
                </Space>
            </Card>

            {/* <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="Recent Activity">
                        <Paragraph type="secondary">
                            Your recent ads activity will appear here
                        </Paragraph>
                    </Card>
                </Col>
                <Col xs={24} lg={12}> */}
            <Card title="Tips for Better Ads">
                <ul className={styles.tipsList}>
                    <li>Keep your message clear and concise</li>
                    <li>Use high-quality visuals and audio</li>
                    <li>Include a strong call-to-action</li>
                    <li>Test different versions of your ad</li>
                    <li>Monitor your analytics regularly</li>
                </ul>
            </Card>
            {/* </Col>
            </Row> */}
        </div>
    );
};

export default Overview;