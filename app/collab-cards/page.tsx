'use client'

import React, { useMemo } from 'react';
import CollabCards from '@/Components/CollabCards';
import { Card, Typography } from 'antd';
import { useSearchParams } from 'next/navigation';

const { Title } = Typography;

const CollabCardsPage: React.FC = () => {
    const searchParams = useSearchParams();
    const userIdFromQuery = searchParams.get('user') || undefined;
    const effectiveUserId = useMemo(() => userIdFromQuery, [userIdFromQuery]);

    return (
        <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f5f5' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <Title level={2}>Collab Cards</Title>
                    <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                        Fast Payout Option via Stripe Issuing
                    </p>
                </Card>
                <CollabCards userId={effectiveUserId} />
            </div>
        </div>
    );
};

export default CollabCardsPage; 