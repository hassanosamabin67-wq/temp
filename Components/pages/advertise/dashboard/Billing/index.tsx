'use client';
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, Descriptions, Divider, Alert } from 'antd';
import {
    CreditCardOutlined,
    DownloadOutlined,
    EyeOutlined,
    EditOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import dayjs from 'dayjs';
import styles from './styles.module.css';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title, Text, Paragraph } = Typography;

interface Invoice {
    id: string;
    ad_id: string;
    amount: number;
    payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    paid_at?: string;
    created_at: string;
    stripe_payment_intent_id: string;
    stripe_charge_id?: string;
    ad_title: string;
    room_title: string;
}

interface PaymentMethod {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    type?: string;
}

const Billing = () => {
    const profile = useAppSelector((state) => state.auth);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);
    const [updatePaymentModalVisible, setUpdatePaymentModalVisible] = useState(false);
    const { notify } = useNotification();

    useEffect(() => {
        fetchInvoices();
        fetchPaymentMethod();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ads/billing/invoices?advertiser_id=${profile.profileId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setInvoices(result.invoices);
            } else {
                notify({
                    type: 'error',
                    message: result.error || 'Failed to load invoices'
                });
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            notify({
                type: 'error',
                message: 'Failed to load invoices. Please try again later.'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethod = async () => {
        try {
            setPaymentMethodLoading(true);
            const response = await fetch(`/api/ads/billing/payment-method?advertiser_id=${profile.profileId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setPaymentMethod(null);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setPaymentMethod(result.paymentMethod);
            }
        } catch (error) {
            console.error('Error fetching payment method:', error);
        } finally {
            setPaymentMethodLoading(false);
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'succeeded': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            case 'refunded': return 'default';
            default: return 'default';
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'succeeded': return <CheckCircleOutlined />;
            case 'pending': return <DollarOutlined />;
            case 'failed': return <CloseCircleOutlined />;
            case 'refunded': return <CloseCircleOutlined />;
            default: return null;
        }
    };

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setInvoiceModalVisible(true);
    };

    const handleDownloadReceipt = async (invoice: Invoice) => {
        try {
            // Open receipt in new tab - user can then print/save as PDF
            const url = `/api/ads/billing/receipt?purchase_id=${invoice.id}`;
            window.open(url, '_blank');

            notify({
                type: 'success',
                message: 'Receipt opened in new tab. You can print or save as PDF.'
            });
        } catch (error) {
            console.error('Error opening receipt:', error);
            notify({
                type: 'error',
                message: 'Failed to open receipt. Please try again.'
            });
        }
    };

    const handleUpdatePaymentMethod = () => {
        setUpdatePaymentModalVisible(true);
    };

    const columns: ColumnsType<Invoice> = [
        {
            title: 'Invoice Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => (
                <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
            ),
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
        },
        {
            title: 'Ad Campaign',
            dataIndex: 'ad_title',
            key: 'ad_title',
            render: (title, record) => (
                <div>
                    <Text strong>{title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.room_title}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <Text strong>${Number(amount).toFixed(2)}</Text>
            ),
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: 'Status',
            dataIndex: 'payment_status',
            key: 'payment_status',
            render: (status) => (
                <Tag icon={getPaymentStatusIcon(status)} color={getPaymentStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Succeeded', value: 'succeeded' },
                { text: 'Pending', value: 'pending' },
                { text: 'Failed', value: 'failed' },
                { text: 'Refunded', value: 'refunded' },
            ],
            onFilter: (value, record) => record.payment_status === value,
        },
        {
            title: 'Payment Date',
            dataIndex: 'paid_at',
            key: 'paid_at',
            render: (date) => (
                <Text>{date ? dayjs(date).format('MMM DD, YYYY') : '-'}</Text>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewInvoice(record)}
                    >
                        View
                    </Button>
                    {record.payment_status === 'succeeded' && (
                        <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadReceipt(record)}
                        >
                            Receipt
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.billingContainer}>
            <div className={styles.header}>
                <Title level={2}>Billing & Invoices</Title>
                <Paragraph>Manage your payment methods and view invoice history</Paragraph>
            </div>

            {/* Payment Method Card */}
            <Card
                title={
                    <Space>
                        <CreditCardOutlined />
                        <Text strong>Payment Method on File</Text>
                    </Space>
                }
                extra={
                    <ActionButton
                        icon={<EditOutlined />}
                        onClick={handleUpdatePaymentMethod}
                    >
                        Update Payment Info
                    </ActionButton>
                }
                loading={paymentMethodLoading}
                className={styles.paymentMethodCard}
            >
                {paymentMethod ? (
                    <Descriptions column={1}>
                        <Descriptions.Item label="Card Type">
                            <Text strong>{paymentMethod.brand?.toUpperCase() || 'N/A'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Card Number">
                            <Text>•••• •••• •••• {paymentMethod.last4 || '****'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Expiration">
                            <Text>
                                {paymentMethod.exp_month && paymentMethod.exp_year
                                    ? `${String(paymentMethod.exp_month).padStart(2, '0')}/${paymentMethod.exp_year}`
                                    : 'N/A'}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Alert
                        message="No Payment Method"
                        description="You don't have a payment method on file yet. Add one when purchasing your first ad."
                        type="info"
                        showIcon
                    />
                )}
            </Card>

            <Divider />

            {/* Invoice History */}
            <Card
                title={
                    <Space>
                        <Text strong style={{ fontSize: 18 }}>Invoice History</Text>
                    </Space>
                }
                className={styles.invoiceCard}
            >
                <Table
                    columns={columns}
                    dataSource={invoices}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} invoices`
                    }}
                />
            </Card>

            {/* Invoice Detail Modal */}
            <Modal
                title="Invoice Details"
                open={invoiceModalVisible}
                onCancel={() => setInvoiceModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setInvoiceModalVisible(false)}>
                        Close
                    </Button>,
                    selectedInvoice?.payment_status === 'succeeded' && (
                        <ActionButton
                            key="download"
                            icon={<DownloadOutlined />}
                            onClick={() => selectedInvoice && handleDownloadReceipt(selectedInvoice)}
                        >
                            Download Receipt
                        </ActionButton>
                    )
                ]}
                width={700}
            >
                {selectedInvoice && (
                    <div>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Invoice ID">
                                {selectedInvoice.id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Invoice Date">
                                {dayjs(selectedInvoice.created_at).format('MMMM DD, YYYY')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ad Campaign">
                                {selectedInvoice.ad_title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Room">
                                {selectedInvoice.room_title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Amount">
                                <Text strong style={{ fontSize: 16 }}>${Number(selectedInvoice.amount).toFixed(2)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                <Tag icon={getPaymentStatusIcon(selectedInvoice.payment_status)} color={getPaymentStatusColor(selectedInvoice.payment_status)}>
                                    {selectedInvoice.payment_status.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            {selectedInvoice.paid_at && (
                                <Descriptions.Item label="Payment Date">
                                    {dayjs(selectedInvoice.paid_at).format('MMMM DD, YYYY HH:mm')}
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Payment Intent ID">
                                <Text code>{selectedInvoice.stripe_payment_intent_id}</Text>
                            </Descriptions.Item>
                            {selectedInvoice.stripe_charge_id && (
                                <Descriptions.Item label="Charge ID">
                                    <Text code>{selectedInvoice.stripe_charge_id}</Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </div>
                )}
            </Modal>

            {/* Update Payment Method Modal */}
            <Modal
                title="Update Payment Information"
                open={updatePaymentModalVisible}
                onCancel={() => setUpdatePaymentModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setUpdatePaymentModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={600}
            >
                <Alert
                    message="Payment Method Management"
                    description="Your payment method is managed securely through Stripe. When you purchase your next ad, you'll have the option to use a saved payment method or add a new one."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Paragraph>
                    <strong>Current Payment Method:</strong>
                </Paragraph>
                {paymentMethod ? (
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text><strong>Card:</strong> {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}</Text>
                            <Text><strong>Expires:</strong> {paymentMethod.exp_month}/{paymentMethod.exp_year}</Text>
                        </Space>
                    </Card>
                ) : (
                    <Alert
                        message="No payment method on file"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Paragraph type="secondary">
                    To update your payment method, you'll need to make a new ad purchase. During checkout, you can choose to save a new payment method.
                </Paragraph>
            </Modal>
        </div>
    );
};

export default Billing;