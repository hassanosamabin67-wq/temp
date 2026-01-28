import React, { useState } from 'react';
import { Button, Tag, Space, Card, Empty } from 'antd';
import { CreditCardOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AddCardModal } from './AddCardModal';
import { PaymentMethodUI } from '@/types/dashboardPaymentTab/paymentInterface';

interface PaymentMethodsProps {
    methods: PaymentMethodUI[];
    loading: boolean;
    userId: string;
    userInfo: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    onSetDefault: (paymentMethodId: string) => void;
    onRemove: (paymentMethodId: string) => void;
    onAdded: () => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ methods, loading, userId, userInfo, onSetDefault, onRemove, onAdded }) => {
    const [addModalOpen, setAddModalOpen] = useState(false);

    return (
        <div style={{ padding: '24px' }}>
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                    Payment Methods
                </span>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ borderRadius: '8px', fontWeight: 500 }}
                    onClick={() => setAddModalOpen(true)}
                >
                    Add Method
                </Button>
            </div>

            {methods.length === 0 ? (
                <Empty
                    description="No payment methods added yet"
                    style={{ padding: '60px 20px' }}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {methods.map((method) => (
                        <Card
                            key={method.id}
                            style={{
                                borderRadius: '12px',
                                border: method.isDefault ? '2px solid #1890ff' : '1px solid #d9d9d9'
                            }}
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: 48,
                                        height: 32,
                                        background: '#f5f5f5',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <CreditCardOutlined />
                                    </div>
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 4
                                        }}>
                                            <span style={{ fontSize: 16, fontWeight: 500 }}>
                                                {method.brand.toUpperCase()} •••• {method.last4}
                                            </span>
                                            {method.isDefault && (
                                                <Tag
                                                    color="#52c41a"
                                                    style={{
                                                        background: '#f6ffed',
                                                        color: '#52c41a',
                                                        border: '1px solid #b7eb8f',
                                                        borderRadius: 12,
                                                        padding: '2px 8px',
                                                        fontSize: 12,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Default
                                                </Tag>
                                            )}
                                        </div>
                                        <span style={{ color: '#8c8c8c' }}>
                                            Expires {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
                                        </span>
                                    </div>
                                </div>

                                <Space size="small">
                                    {!method.isDefault && (
                                        <Button
                                            type="text"
                                            size="small"
                                            onClick={() => onSetDefault(method.id)}
                                        >
                                            Set Default
                                        </Button>
                                    )}
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => onRemove(method.id)}
                                    >
                                        Remove
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <AddCardModal
                open={addModalOpen}
                userId={userId}
                userInfo={userInfo}
                onClose={() => setAddModalOpen(false)}
                onAdded={() => {
                    onAdded();
                    setAddModalOpen(false);
                }}
            />
        </div>
    );
};