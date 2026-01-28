import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col } from 'antd';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';

const AuditHistory = () => {
    const [loading, setLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any>([]);

    const handleFetchHistory = async () => {
        try {
            setLoading(true)
            const { data: historyData, error: fetchError } = await supabase
                .from("platform_logs")
                .select('*')
                .in('action_type', ['user', 'room']);

            if (fetchError) {
                console.error(`Error fetchError system logs`, fetchError);
                return;
            }

            setHistoryData(historyData);

        } catch (err) {
            console.error("Unexpected Error: ", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleFetchHistory()
    }, [])

    // Mock data for audit history
    const auditHistory = historyData.map((history: any) => ({
        key: history.id,
        action: history.action,
        target: history.target,
        admin: history.admin_name,
        adminId: history.admin_id,
        details: history.details,
        timestamp: history.created_at
    }))

    // Audit History Table Columns
    const auditColumns = [
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
        },
        {
            title: 'Target',
            dataIndex: 'target',
            key: 'target',
            render: (target: any) => <span style={{ fontSize: '12px', color: "#6b7280", fontWeight: "500" }}>{target}</span>,
        },
        {
            title: 'Admin',
            dataIndex: 'admin',
            key: 'admin',
            width: 180,
            render: (admin: string, record: any) => (
                <div>
                    <span style={{ fontWeight: 500, fontSize: '14px', display: "block" }}>{admin || 'System'}</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{record.adminId || ""}</span>
                </div>
            ),
        },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
            ellipsis: true,
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            sorter: true,
            render: (timestamp: any) => (
                <div>
                    <div>{dayjs(timestamp).format('MMM DD, YYYY')}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                        {dayjs(timestamp).format('HH:mm:ss')}
                    </div>
                </div>
            )
        }
    ];

    return (
        <Card>
            <Table
                columns={auditColumns}
                dataSource={auditHistory}
                loading={loading}
                pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                }}
                scroll={{ x: 1300 }}
                expandable={{
                    expandedRowRender: (record) => (
                        <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                            <Row gutter={[16, 8]}>
                                <Col span={24}>
                                    <strong>Details:</strong>
                                    <p style={{ marginTop: '8px', marginBottom: '16px' }}>{record.details}</p>
                                </Col>
                            </Row>
                        </div>
                    ),
                    rowExpandable: () => true,
                }}
            />
        </Card>
    )
}

export default AuditHistory