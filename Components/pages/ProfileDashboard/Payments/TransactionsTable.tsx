import React, { useMemo } from 'react';
import { Table, Tag, Button } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Transaction } from '@/types/dashboardPaymentTab/paymentInterface';
import { formatDate, getStatusColor, getTypeColor } from '@/utils/dashboardPaymentTab/payment';

interface TransactionsTableProps {
    transactions: Transaction[];
    loading: boolean;
    onDownloadPdf: (transaction: Transaction) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
    transactions,
    loading,
    onDownloadPdf,
}) => {
    const columns = useMemo(() => [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date: string) => (
                <span style={{ fontWeight: 500 }}>
                    {formatDate(date)}
                </span>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'stripe_transaction_id',
            key: 'stripe_transaction_id',
            width: 150,
            render: (id: string) => (
                <span style={{
                    color: '#1890ff',
                    fontWeight: 500,
                    fontSize: '12px'
                }}>
                    {/* {id ? `***${id.slice(-8)}` : '-'} */}
                    {id}
                </span>
            ),
        },
        {
            title: 'Purchase',
            dataIndex: 'purchase_name',
            key: 'purchase_name',
            width: 200,
            render: (name: string) => (
                <span style={{ fontWeight: 500 }}>
                    {name || 'N/A'}
                </span>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => (
                <Tag
                    color={getTypeColor(type)}
                    style={{
                        borderRadius: '12px',
                        padding: '4px 12px',
                        fontWeight: 500,
                        textTransform: 'capitalize'
                    }}
                >
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (category: string) => (
                <span style={{
                    color: '#666',
                    textTransform: 'capitalize'
                }}>
                    {category || 'General'}
                </span>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (amount: number, record: Transaction) => (
                <span
                    style={{
                        fontSize: '16px',
                        color: record.type === 'refund' || record.type === 'withdrawal' ? '#f5222d' : '#52c41a',
                        fontWeight: 500
                    }}
                >
                    {/* {record.type === 'refund' || record.type === 'withdrawal' ? '-' : '+'}${amount?.toLocaleString() || '0'} */}
                    ${amount?.toLocaleString() || '0'}
                </span>
            ),
        },
        {
            title: 'Fee',
            dataIndex: 'application_fee',
            key: 'application_fee',
            width: 100,
            render: (fee: number) => (
                <span style={{ color: '#666' }}>
                    ${fee?.toLocaleString() || '0'}
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag
                    color={getStatusColor(status)}
                    icon={status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    style={{
                        borderRadius: '12px',
                        padding: '4px 12px',
                        fontWeight: 500,
                        textTransform: 'capitalize'
                    }}
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Receipt',
            key: 'receipt',
            width: 100,
            render: (_: any, record: Transaction) => (
                <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    style={{
                        color: '#1890ff',
                        fontWeight: 500
                    }}
                    onClick={() => onDownloadPdf(record)}
                >
                    Download
                </Button>
            ),
        }
    ], [onDownloadPdf])

    const dataSource = useMemo(
        () => transactions.map(i => ({ key: i.id, ...i })),
        [transactions]
    );

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={{
                total: dataSource.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} invoices`,
                style: {
                    padding: '16px 24px',
                    borderTop: '1px solid #f0f0f0'
                }
            }}
            scroll={{ x: 1000 }}
            rowHoverable={true}
            style={{ backgroundColor: '#fff' }}
        />
    );
}