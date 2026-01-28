import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Row, Col } from 'antd';
import { supabase } from '@/config/supabase';
import { getSeverityColor } from '../FlaggedContent/iconColor';
import dayjs from 'dayjs';

const SystemLogs = () => {
    const [loading, setLoading] = useState(false);
    const [systemLogsData, setSystemLogsData] = useState<any>([]);

    const handleFetchLogs = async () => {
        try {
            setLoading(true)
            const { data: logData, error: fetchError } = await supabase
                .from("platform_logs")
                .select('*')

            if (fetchError) {
                console.error(`Error fetchError system logs`, fetchError);
                return;
            }

            setSystemLogsData(logData);

        } catch (err) {
            console.error("Unexpected Error: ", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleFetchLogs()
    }, [])

    const systemLogs = systemLogsData.map((log: any) => ({
        key: log.id,
        action: log.action,
        admin: log.admin_name,
        adminId: log.admin_id,
        target: log.target,
        severity: log.severity,
        details: log.details,
        timestamp: log.created_at
    }))

    const logsColumns = [
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
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
            title: 'Target',
            dataIndex: 'target',
            key: 'target',
            width: 300,
            render: (target: any) => <span style={{ fontSize: '12px', color: "#6b7280", fontWeight: "500" }}>{target}</span>,
        },
        {
            title: 'Severity',
            dataIndex: 'severity',
            key: 'severity',
            width: 180,
            render: (severity: string) => (
                <Tag color={getSeverityColor(severity)}>
                    {severity.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
            width: 300,
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
                columns={logsColumns}
                dataSource={systemLogs}
                loading={loading}
                pagination={{
                    total: systemLogsData.length,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                }}
                scroll={{ x: 1200 }}
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

export default SystemLogs