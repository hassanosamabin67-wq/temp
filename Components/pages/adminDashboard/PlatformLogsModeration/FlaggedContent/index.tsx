import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Badge, Space, Tag, Dropdown, MenuProps } from 'antd';
import { FiCheckCircle, FiXCircle, FiMoreVertical } from 'react-icons/fi';
import { getActionTypeColor, getPriorityColor } from './iconColor';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import dayjs from 'dayjs';
import { roomUnFlagNotification } from '@/lib/adminDashboardNoifications/collabRoom';

const FlaggedContent = ({ adminProfile }: any) => {
    const [loading, setLoading] = useState(false);
    const [flaggedData, setFlagegdData] = useState<any>([]);
    const { notify } = useNotification();

    const handleFetchFlags = async () => {
        try {
            setLoading(true)
            const { data: logData, error: fetchError } = await supabase
                .from("platform_logs")
                .select('*')
                .eq('action', 'Content Flagged')

            if (fetchError) {
                console.error(`Error fetchError system logs`, fetchError);
                return;
            }

            const hostIds = [...new Set(logData.map((log) => log.admin_id))];
            const roomIds = [...new Set(logData.map((log) => log.target))];

            const { data: hostData, error: fetchHostError } = await supabase
                .from('users')
                .select('userId, email')
                .in('userId', hostIds);

            if (fetchHostError) {
                console.error("Error fetching host data: ", fetchHostError);
                return;
            }
            const { data: rooms, error: fetchRoomError } = await supabase
                .from('thinktank')
                .select("id,title")
                .in("id", roomIds)

            if (fetchRoomError) {
                console.error("Error fetching rooms: ", fetchRoomError);
                return;
            }
            const enrichedData = logData.map((log) => {
                const room = rooms.find((r) => r.id === log.target);
                const user = hostData.find((u) => u.userId === log.admin_id);

                return {
                    ...log,
                    admin_email: user?.email || null,
                    room_title: room?.title || 'Untitled Room'
                };
            });

            setFlagegdData(enrichedData);

        } catch (err) {
            console.error("Unexpected Error: ", err)
        } finally {
            setLoading(false)
        }
    }

    const handleResolveFlag = async (logId: any, hostId: string, hostEmail: string, roomName: string) => {
        try {
            const { error: updateError } = await supabase
                .from("platform_logs")
                .update({ status: "resolved" })
                .eq("id", logId)

            if (updateError) {
                notify({ type: "error", message: "Error Resolving Flag" })
                console.error("Error Resolving flag ", updateError);
                return;
            }

            try {
                const actionUrl = "";

                await roomUnFlagNotification(adminProfile.profileId, hostId, `Your Collab Room "${roomName}" has been reviewed and is no longer flagged. Thank you for your patience.`, actionUrl, hostEmail, roomName);

            } catch (error) {
                notify({ type: "error", message: "Error Resolving Flag" })
                console.error("Error Resolving flag ", error);
                return;
            }

            notify({ type: "success", message: "Flag Resolved" });
            await handleFetchFlags()

        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    }

    const handleDismissFlag = async (logId: string) => {
        try {
            const { error: updateError } = await supabase
                .from("platform_logs")
                .update({ status: "dismissed" })
                .eq("id", logId)

            if (updateError) {
                notify({ type: "error", message: "Error Dismissing Flag" })
                console.error("Error Dismissing flag ", updateError);
                return;
            }

            notify({ type: "success", message: "Flag Dismissed" });
            await handleFetchFlags()

        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    }

    useEffect(() => {
        handleFetchFlags()
    }, [])

    const flaggedContent = flaggedData.map((flagContent: any) => ({
        key: flagContent.id,
        type: flagContent.action_type,
        admin: flagContent.admin_name,
        adminId: flagContent.admin_id,
        admin_email: flagContent.admin_email,
        target: flagContent.room_title,
        detail: flagContent.details,
        status: flagContent.status,
        timestamp: flagContent.created_at
    }))

    const flaggedColumns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: any) => (
                <Space>
                    <Tag color={getActionTypeColor(type)}>
                        {type.toUpperCase(type)}
                    </Tag>
                </Space>
            ),
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
            title: 'Detail',
            dataIndex: 'detail',
            key: 'detail',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any) => (
                <Badge
                    status={status === 'resolved' ? 'success' : status === 'pending' ? 'warning' : 'error'}
                    text={status.charAt(0).toUpperCase() + status.slice(1)}
                />
            ),
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
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => {
                const actionMenu: MenuProps['items'] = [
                    {
                        key: "1",
                        label: "Resolve",
                        icon: (<FiCheckCircle />),
                        onClick: () => handleResolveFlag(record.key, record.adminId, record.admin_email, record.target),
                    },
                    {
                        key: "2",
                        label: "Dismiss",
                        icon: (<FiXCircle />),
                        onClick: () => handleDismissFlag(record.key),
                    }]

                return (
                    <Dropdown menu={{ items: actionMenu }} trigger={['click']}>
                        <Button type="text" icon={<FiMoreVertical />} size="small" />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <Card>
            <Table
                columns={flaggedColumns}
                dataSource={flaggedContent}
                loading={loading}
                pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                }}
                scroll={{ x: 1400 }}
            />
        </Card>
    )
}

export default FlaggedContent