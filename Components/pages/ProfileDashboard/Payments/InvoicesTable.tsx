import React, { useMemo } from 'react';
import { Table, Tag, Button } from 'antd';
import { DownloadOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { InvoiceInterface } from '@/types/dashboardPaymentTab/paymentInterface';
import { currency, formatDate, getStatusColor } from '@/utils/dashboardPaymentTab/payment';

interface InvoicesTableProps {
    invoices: InvoiceInterface[];
    loading: boolean;
    onDownloadPdf: (invoice: InvoiceInterface) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
    invoices,
    loading,
    onDownloadPdf,
}) => {
    const columns = useMemo(() => [
        {
            title: 'Invoice #',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            width: 140,
            render: (id: string) => (
                <span style={{ color: '#1890ff', fontWeight: 500 }}>{id}</span>
            ),
        },
        {
            title: 'Project',
            dataIndex: 'project',
            key: 'project',
            width: 260,
            render: (project: string) => <span style={{ fontWeight: 500 }}>{project || '-'}</span>,
        },
        {
            title: 'Total',
            dataIndex: 'totalCents',
            key: 'totalCents',
            width: 140,
            render: (_: any, record: InvoiceInterface) => (
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                    {currency(record.totalCents, record.currency)}
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <Tag
                    color={getStatusColor(status)}
                    icon={status?.toLowerCase() === 'paid' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    style={{
                        borderRadius: 12,
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
            title: 'Issue Date',
            dataIndex: 'issueDate',
            key: 'issueDate',
            width: 140,
            render: (iso: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                    <span>{formatDate(iso)}</span>
                </div>
            ),
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: 140,
            render: (iso: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                    <span>{formatDate(iso)}</span>
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_: any, record: InvoiceInterface) => (
                <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    style={{ color: '#1890ff', fontWeight: 500 }}
                    onClick={() => onDownloadPdf(record)}
                >
                    Download
                </Button>
            ),
        },
    ], [onDownloadPdf]);

    const dataSource = useMemo(
        () => invoices.map(i => ({ key: i.id, ...i })),
        [invoices]
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
};