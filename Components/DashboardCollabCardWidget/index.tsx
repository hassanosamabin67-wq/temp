'use client'

import React, { useEffect, useState } from 'react';
import { Card, Button, Progress, Typography, Tag } from 'antd';
import { CreditCardOutlined, DollarOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/navigation';
import { getCardStatus } from '@/utils/cardEligibility';
import './style.css';

const { Title, Text } = Typography;

const DashboardCollabCardWidget: React.FC = () => {
    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const [cardStatus, setCardStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCardStatus();
    }, [profile.profileId]);

    const fetchCardStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stripe/issuing/card-status?userId=${profile.profileId}`);
            const data = await response.json();

            if (data.success) {
                setCardStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching card status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCards = () => {
        router.push('/collab-cards');
    };

    if (loading) {
        return (
            <Card className="collab-card-widget" loading={true}>
                <div style={{ height: '120px' }}></div>
            </Card>
        );
    }

    if (!cardStatus) {
        return null;
    }

    // If user has an active card
    if (cardStatus.hasActiveCard && cardStatus.activeCard) {
        return (
            <Card className="collab-card-widget active-card">
                <div className="widget-header">
                    <CreditCardOutlined className="widget-icon" />
                    <Title level={4}>Collab Card</Title>
                </div>
                
                <div className="card-info">
                    <div className="card-number">
                        •••• {cardStatus.activeCard.last_four}
                    </div>
                    <Tag color={cardStatus.activeCard.card_type === 'earn_it' ? 'green' : 'blue'}>
                        {cardStatus.activeCard.card_type === 'earn_it' ? 'Earned' : 'Purchased'}
                    </Tag>
                </div>
                
                <Button type="primary" onClick={handleViewCards} size="small">
                    View Card
                </Button>
            </Card>
        );
    }

    // If user doesn't have a card yet
    return (
        <Card className="collab-card-widget">
            <div className="widget-header">
                <CreditCardOutlined className="widget-icon" />
                <Title level={4}>Collab Card</Title>
            </div>
            
            <div className="earnings-progress">
                <Text>Earnings: ${cardStatus.currentEarnings}</Text>
                <Progress 
                    percent={Math.min((cardStatus.currentEarnings / 500) * 100, 100)} 
                    size="small"
                    status={cardStatus.isEligibleForFreeCard ? 'success' : 'active'}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    {cardStatus.isEligibleForFreeCard 
                        ? 'You qualify for a free card!' 
                        : `$${500 - cardStatus.currentEarnings} more to qualify`
                    }
                </Text>
            </div>
            
            <Button 
                type={cardStatus.isEligibleForFreeCard ? "primary" : "default"}
                onClick={handleViewCards}
                size="small"
                icon={<DollarOutlined />}
            >
                {cardStatus.isEligibleForFreeCard ? 'Get Free Card' : 'View Options'}
            </Button>
        </Card>
    );
};

export default DashboardCollabCardWidget; 