import { supabase } from '@/config/supabase';
import { CheckCircleOutlined, ClockCircleOutlined, CreditCardOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { Alert, Badge, Button, Card, Select, Space, Spin, Table, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react'

interface StripeTransactionsProps {
    onFetchData: () => Promise<any[] | undefined>;
}

const StripeTransactions: React.FC<StripeTransactionsProps> = ({ onFetchData }) => {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loadingTransaction, setLoadingTransaction] = useState(false);
    const [transactionData, setTransactionData] = useState<any>([]);
    const [filteredTransaction, setfilteredTransaction] = useState<any>([]);

    const fetchData = async () => {
        try {
            setLoadingTransaction(true);
            const data = await onFetchData();
            if (data) {
                setTransactionData(data);
                setfilteredTransaction(data);
            }
        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoadingTransaction(false);
        }
    };

    const handleCategoryFilter = (value: string) => {
        const category = value ?? 'all';
        setCategoryFilter(category);
        handleFilterData(category);
    };

    const handleFilterData = (category: string, sourceData = transactionData) => {
        if (category === 'all' || category === '') {
            setfilteredTransaction(sourceData);
            return;
        }
        const filtered = sourceData.filter((item: { category: string }) => item.category === category);
        setfilteredTransaction(filtered);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const stripeTransactionsData = filteredTransaction.map((data: any) => ({
        key: data.id,
        transactionId: data.stripe_transaction_id,
        date: data.created_at,
        amount: data.amount,
        applicationFee: data.application_fee,
        category: data.category,
        status: data.status,
        customerId: data?.clientData?.userId,
        customerEmail: data?.clientData?.email,
        visionaryId: data?.visionaryData?.userId,
        visionaryName: data?.visionaryData?.userName || `${data?.visionaryData?.firstName} ${data?.visionaryData?.lastName}`,
        stripeAccountId: data?.visionaryData?.stripe_account_id,
    }))

    const stripeTransactionColumns = [
        {
            title: 'Transaction',
            dataIndex: 'transactionId',
            key: 'transactionId',
            width: 200,
            render: (id: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>
                        {id}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        {dayjs(record.date).format('MMM DD, YYYY HH:mm')}
                    </div>
                </div>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (amount: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{typeof amount === 'number' ? `$${amount.toFixed(2)}` : 'N/A'}</div>
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            render: (category: any) => {
                const colors: Record<any, any> = {
                    'Service': 'blue',
                    'Collab Room': 'green',
                    'Tips': 'orange',
                    'Contracts': 'purple'
                };
                return <Tag color={colors[category]}>{category}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: any) => {
                const statusConfig: Record<any, any> = {
                    succeeded: { color: 'success', text: 'Succeeded', icon: <CheckCircleOutlined /> },
                    processing: { color: 'processing', text: 'Processing', icon: <ClockCircleOutlined /> },
                    requires_action: { color: 'warning', text: 'Requires Action', icon: <ExclamationCircleOutlined /> },
                    failed: { color: 'error', text: 'Failed', icon: <ExclamationCircleOutlined /> }
                };

                const config = statusConfig[status];

                if (!config) {
                    return <Badge status="default" text={`Unknown (${status})`} />;
                }

                return <Badge status={config.color} text={config.text} />;
            }
        },
        {
            title: 'Customer',
            dataIndex: 'customerEmail',
            key: 'customerEmail',
            width: 180,
            render: (email: any, record: any) => (
                <div>
                    <div style={{ fontSize: '12px' }}>{email}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>ID: {record.customerId}</div>
                </div>
            )
        },
        {
            title: 'Visionary',
            dataIndex: 'visionaryName',
            key: 'visionaryName',
            width: 150,
            render: (name: any, record: any) => (
                <div>
                    <div style={{ fontWeight: '500' }}>{name}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>ID: {record.visionaryId}</div>
                </div>
            )
        },
        {
            title: 'Application Fee',
            dataIndex: 'applicationFee',
            key: 'applicationFee',
            width: 120,
            render: (fee: any) => {
                return (
                    <div style={{ fontSize: '16px', fontWeight: "500", color: '#52c41a' }}>
                        {typeof fee === 'number' ? `$${fee.toFixed(2)}` : 'N/A'}
                    </div>
                );
            }
        },
        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     width: 100,
        //     render: (_: any, record: any) => (
        //         <Space>
        //             <Tooltip title="View Details">
        //                 <Button size="small" icon={<EyeOutlined />} />
        //             </Tooltip>
        //             <Tooltip title="Stripe Dashboard">
        //                 <Button size="small" icon={<CreditCardOutlined />} />
        //             </Tooltip>
        //         </Space>
        //     )
        // }
    ];

    return (
        <Card>
            <Alert
                message="Application Fee Monitoring"
                description="All transactions are automatically monitored for proper application fee collection. Discrepancies are flagged for review."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
            />

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {/* <Input
                    placeholder="Search transactions..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                /> */}

                <Select
                    placeholder="Category"
                    style={{ width: 150 }}
                    onChange={handleCategoryFilter}
                    allowClear
                    onClear={() => handleCategoryFilter("")}
                >
                    <Select.Option value="all">All Categories</Select.Option>
                    <Select.Option value="Service">Services</Select.Option>
                    <Select.Option value="Collab Room">Rooms</Select.Option>
                    <Select.Option value="tips">Tips</Select.Option>
                    <Select.Option value="contracts">Contracts</Select.Option>
                </Select>
            </div>

            <Table
                columns={stripeTransactionColumns}
                loading={loadingTransaction}
                dataSource={stripeTransactionsData}
                scroll={{ x: 1400 }}
                pagination={{
                    total: filteredTransaction.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} transactions`
                }}
            />
        </Card>
    )
}

export default StripeTransactions