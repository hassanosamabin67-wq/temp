'use client'
import React, { useEffect, useState } from 'react';
import { Card, Avatar, Tag, Button, Space, Rate, Typography, Row, Col, Switch, Collapse, Badge, Tooltip } from 'antd';
import { EyeOutlined, MessageOutlined, PlusOutlined, AppstoreOutlined, UnorderedListOutlined, HeartOutlined, HeartFilled, ExpandAltOutlined } from '@ant-design/icons';
import VisionaryCard from '../../exploreVisionaries/VisionaryCard';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useMyNetwork } from '@/hooks/useMyNetwork';
import { useRouter } from 'next/navigation';
import VisionarySuggestion from './Suggestion';
import styles from './style.module.css'
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const MyNetworkDashboard = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showInterested, setShowInterested] = useState<any>([]);
    const profile = useAppSelector((state) => state.auth);
    const { favoriteVisionaries, addVisionaryLoading, toggleFavorite, allVisionaries } = useMyNetwork(profile.profileId!)
    const [dataLoading, setDataLoading] = useState(false);
    const router = useRouter()
    const [suggestionDismiss, setSuggestionDismiss] = useState(false)

    const handleFetchAllVisionaries = async () => {
        try {
            setDataLoading(true)
            const { data, error: fetchError } = await supabase
                .from("my_network")
                .select("visionary_id")
                .eq("client_id", profile.profileId);

            if (fetchError) {
                console.error("Error fetching favorite visionaries:", fetchError);
                return;
            }

            const visionaryIds = [...new Set(data.map((v) => v.visionary_id))]

            const { data: visionaries, error } = await supabase
                .from('users')
                .select("*")
                .eq("profileType", "Visionary")
                .in("userId", visionaryIds)

            if (error) {
                console.error("Error Fetching Visionaries: ", error);
                return;
            }

            const { data: visionariesPortfolio, error: portfolioError } = await supabase
                .from('profile_portfolio')
                .select("*")
                .in("user_id", visionaryIds)

            if (portfolioError) {
                console.error("Error Fetching Visionary's Portfolio: ", portfolioError);
                return;
            }

            const combinedResult = visionaries.map((v) => {
                const visionaryPortfolios = visionariesPortfolio.filter((p) => p.user_id === v.userId);
                return {
                    ...v,
                    portfolioUploaded: visionaryPortfolios.length || null
                }
            })

            setShowInterested(combinedResult)

        } catch (err) {
            console.error("Unexpected Error While Fetching Visionaries: ", err)
        } finally {
            setDataLoading(false)
        }
    }

    useEffect(() => {
        handleFetchAllVisionaries()
    }, [])

    const renderEmptyState = () => (
        <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#fafafa',
            borderRadius: '16px',
            border: '2px dashed #d9d9d9'
        }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                👥
            </div>
            <Title level={3} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
                Build your network
            </Title>
            <Text style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '24px', marginRight: '25px' }}>
                Connect with visionaries to see them here
            </Text>
            <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                style={{
                    borderRadius: '8px',
                    fontWeight: 500,
                    height: '44px',
                    paddingLeft: '24px',
                    paddingRight: '24px'
                }}
                onClick={() => router.push("/visionaries")}
            >
                Find Visionaries
            </Button>
        </div>
    );

    return (
        <MaxWidthWrapper withPadding={false} style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minHeight: '600px'
        }}>
            {/* Header */}
            <div style={{
                padding: '24px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
            }}>
                <div className={styles.myNetworkHeader}>
                    <div>
                        <Title level={2} style={{ margin: 0, marginBottom: '4px' }}>
                            My Network
                        </Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                            Your trusted network of {showInterested.length} visionaries
                        </Text>
                    </div>

                    <Space size="middle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AppstoreOutlined style={{ color: viewMode === 'grid' ? '#1890ff' : '#8c8c8c' }} />
                            <Switch
                                checked={viewMode === 'list'}
                                onChange={(checked) => setViewMode(checked ? 'list' : 'grid')}
                                size="small"
                            />
                            <UnorderedListOutlined style={{ color: viewMode === 'list' ? '#1890ff' : '#8c8c8c' }} />
                        </div>

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ borderRadius: '8px', fontWeight: 500 }}
                            onClick={() => router.push('/visionaries')}
                        >
                            Add to Network
                        </Button>
                    </Space>
                </div>

                {/* {interestedMembers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Badge count={interestedMembers.length} color="#52c41a">
                            <HeartOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                        </Badge>
                        <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                            {interestedMembers.length} member{interestedMembers.length !== 1 ? 's' : ''} interested in your projects
                        </Text>
                    </div>
                )} */}
            </div>

            {/* Content */}
            <div className={styles.suggestedVisionarie}>
                {!suggestionDismiss && (<VisionarySuggestion setSuggestionDismiss={setSuggestionDismiss} />)}
            </div>
            <div className={styles.suggestedVisionarie}>
                {(showInterested && showInterested?.length === 0) ? (
                    renderEmptyState()
                ) : (
                    <>
                        {/* Interested Members Section */}

                        {/* Network Grid/List */}
                        <Row
                            gutter={[24, 24]}
                            style={{
                                maxWidth: viewMode === 'list' ? '1024px' : 'none',
                                margin: viewMode === 'list' ? '0 auto' : '0'
                            }}>
                            {/* {networkData.map((visionary) => (
                                <Col
                                    key={visionary.key}
                                    xs={24}
                                    sm={viewMode === 'grid' ? 12 : 24}
                                    lg={viewMode === 'grid' ? 8 : 24}
                                    xl={viewMode === 'grid' ? 6 : 24}
                                >
                                    {renderVisionaryCard(visionary, viewMode === 'list')}
                                </Col>
                            ))} */}
                            {(showInterested && showInterested.length > 0) && showInterested.map((visionary: any) => {
                                const isFavorite = favoriteVisionaries.includes(visionary.userId);
                                return (
                                    <Col
                                        key={visionary.userId}
                                        xs={24}
                                        sm={viewMode === 'grid' ? 12 : 24}
                                        lg={viewMode === 'grid' ? 8 : 24}
                                    >
                                        <VisionaryCard visionary={visionary} isFavorite={isFavorite} addFavorite={toggleFavorite} addLoading={addVisionaryLoading} />
                                    </Col>
                                )
                            })}
                        </Row>
                    </>
                )}
            </div>
        </MaxWidthWrapper>
    );
};

export default MyNetworkDashboard;