'use client'

import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Alert, Spin } from 'antd';
import { CheckCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/Components/custom/custom-notification';

const { Title, Text } = Typography;

const CollabCardSuccessPage: React.FC = () => {
    const router = useRouter();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(true);
    const [cardCreated, setCardCreated] = useState(false);

    useEffect(() => {
        // Simulate card creation process
        const timer = setTimeout(() => {
            setCardCreated(true);
            setLoading(false);
            notify({ type: 'success', message: 'Collab Card created successfully!' });
        }, 2000);

        return () => clearTimeout(timer);
    }, [notify]);

    const handleViewCard = () => {
        router.push('/collab-cards');
    };

    const handleGoToDashboard = () => {
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                minHeight: '100vh', 
                background: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Spin size="large" />
                <div style={{ marginTop: '24px', fontSize: '18px' }}>
                    Creating your Collab Card...
                </div>
                <Text type="secondary" style={{ marginTop: '8px' }}>
                    This may take a few moments
                </Text>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '40px', 
            minHeight: '100vh', 
            background: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Card style={{ 
                maxWidth: '500px', 
                textAlign: 'center',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
            }}>
                <CheckCircleOutlined 
                    style={{ 
                        fontSize: '64px', 
                        color: '#52c41a', 
                        marginBottom: '24px' 
                    }} 
                />
                
                <Title level={2} style={{ marginBottom: '16px' }}>
                    Payment Successful!
                </Title>
                
                <Text style={{ fontSize: '16px', color: '#666', marginBottom: '32px', display: 'block' }}>
                    Your Collab Card has been created and is ready to use.
                </Text>

                <Alert
                    message="Card Details"
                    description={
                        <div>
                            <div>• Virtual card available immediately</div>
                            <div>• Access your earnings instantly</div>
                            <div>• Physical card option coming soon</div>
                        </div>
                    }
                    type="success"
                    showIcon
                    style={{ marginBottom: '32px', textAlign: 'left' }}
                />

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Button 
                        type="primary" 
                        size="large"
                        icon={<CreditCardOutlined />}
                        onClick={handleViewCard}
                    >
                        View My Card
                    </Button>
                    
                    <Button 
                        size="large"
                        onClick={handleGoToDashboard}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default CollabCardSuccessPage; 