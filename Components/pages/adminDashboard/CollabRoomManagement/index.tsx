import React, { useState, useEffect } from 'react';
import { FaDollarSign } from "react-icons/fa";
import { IoFlagOutline } from "react-icons/io5";
import { LuUsers } from "react-icons/lu";
import style from './style.module.css'
import { Select, Spin, Table, Button, Tag, Space, Card } from 'antd';
import { CalendarOutlined, StopOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import { useNotification } from '@/Components/custom/custom-notification';
import { logContentAction } from '@/utils/PlatformLogging';
import { roomDisableNotification, roomEnableNotification, roomFlagNotification, roomUnFlagNotification } from '@/lib/adminDashboardNoifications/collabRoom';

const CollabRoomManagement = ({ adminProfile }: any) => {
    const [filteredRooms, setFilteredRooms] = useState<any>([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [roomData, setRoomData] = useState<any>([]);
    const { notify } = useNotification();

    const fetchRoomData = async () => {
        try {
            setLoading(true);

            const { data: rooms, error: fetchError } = await supabase
                .from('thinktank')
                .select("*");

            if (fetchError) {
                console.error("Error fetching rooms: ", fetchError);
                return;
            }

            const hostIds = [...new Set(rooms.map((room) => room.host))];
            const roomIds = rooms.map((room) => room.id);

            const { data: hostData, error: fetchHostError } = await supabase
                .from('users')
                .select('userId, firstName, lastName, userName, email')
                .in('userId', hostIds);

            if (fetchHostError) {
                console.error("Error fetching host data: ", fetchHostError);
                return;
            }

            const { data: participantsData, error: fetchPtError } = await supabase
                .from('think_tank_participants')
                .select('*')
                .in('think_tank_id', roomIds)
                .eq('status', "Accepted");

            if (fetchPtError) {
                console.error("Error fetching participants data: ", fetchPtError);
                return;
            }

            const { data: roomEvents, error: fetchEventsError } = await supabase
                .from('think_tank_events')
                .select('price, type, participants, think_tank_id')
                .in('think_tank_id', roomIds);

            if (fetchEventsError) {
                console.error("Error fetching room events: ", fetchEventsError);
                return;
            }

            const hostMap = new Map();
            hostData.forEach((host) => {
                hostMap.set(host.userId, host);
            });

            const currentDate = new Date();
            const upcomingThreshold = new Date(currentDate);
            upcomingThreshold.setDate(currentDate.getDate() + 4);

            const combinedData = rooms.map((room) => {
                const roomParticipants = participantsData.filter((p) => p.think_tank_id === room.id);
                const events = roomEvents.filter((event) => event.think_tank_id === room.id);

                const roomDonations = events
                    .filter((e) => e.type === "Donation based")
                    .reduce((sum, e) => sum + Number(e.price || 0), 0);

                const roomEarnings = events
                    .filter((e) => e.type === "Direct Payment")
                    .reduce((sum, e) => sum + Number(e.price || 0), 0);

                const totalRevenue = (room.price || 0) + roomEarnings;
                const ticketSold = events.reduce((sum, e) => sum + (e.participants.length || 0), 0);

                let status = 'past';
                if (room.recurring === 'One-Time Think Tank') {
                    if (new Date(room.one_time_date) > currentDate) {
                        if (new Date(room.one_time_date) <= upcomingThreshold) {
                            status = 'upcoming';
                        } else {
                            status = 'active';
                        }
                    }
                } else {
                    if (new Date(room.end_datetime) > currentDate) {
                        if (new Date(room.end_datetime) <= upcomingThreshold) {
                            status = 'upcoming';
                        } else {
                            status = 'active';
                        }
                    }
                }

                return {
                    ...room,
                    hostData: hostMap.get(room.host) || null,
                    guests: roomParticipants.length,
                    status,
                    ticketSold,
                    roomRevenue: totalRevenue,
                    donations: roomDonations,
                };
            });

            setRoomData(combinedData);
            setFilteredRooms(combinedData)
        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value)
        filterRoom(value, typeFilter);
    }

    const handleTypeFilter = (value: string) => {
        setTypeFilter(value)
        filterRoom(statusFilter, value);
    }

    const filterRoom = (status: string, type: string, sourceData = roomData) => {
        let filtered = sourceData;

        if (status) {
            if (status === "flagged") {
                filtered = filtered.filter((item: { flagged: string }) => item.flagged);
            } else if (status === "disabled") {
                filtered = filtered.filter((item: { disabled: string }) => item.disabled);
            } else {
                filtered = filtered.filter((item: { status: string }) => item.status === status);
            }
        }

        if (type) {
            filtered = filtered.filter((item: { room_type: string }) => item.room_type === type);
        }

        setFilteredRooms(filtered);
    };

    useEffect(() => {
        fetchRoomData()
    }, [])

    const handleFlagRoom = async (roomId: any, flagged: boolean, host: string, hostId: string, hostEmail: string, roomName: string) => {
        try {
            const { error: updateError } = await supabase
                .from('thinktank')
                .update({ flagged: !flagged })
                .eq('id', roomId)
            if (updateError) {
                notify({ type: "error", message: `${flagged ? "Error: Unable to remove flag from the room." : `Error: Unable to flag the room: ${updateError}`}` })
                console.error("Failed to update flag status: ", updateError);
                return;
            }
            logContentAction.onFlag(flagged, roomId, 'Collab Room', host, hostId, undefined, "room")
            try {
                const message = flagged
                    ? `Your Collab Room "${roomName}" has been reviewed and is no longer flagged. Thank you for your patience.`
                    : `Your Collab Room "${roomName}" has been flagged due to a potential violation of our content policies. Please review the content.`;

                const actionUrl = "";

                const notificationFn = flagged ? roomUnFlagNotification : roomFlagNotification;

                await notificationFn(adminProfile.profileId, hostId, message, actionUrl, hostEmail, roomName);

            } catch (error) {
                notify({ type: "error", message: `${flagged ? "Error: Unable to remove flag from the room." : `Error: Unable to flag the room: ${updateError}`}` })
                console.error("Failed to update flag status: ", updateError);
                return;
            }
            notify({ type: "success", message: `${flagged ? "Room has been unflagged." : "Room has been flagged."}` });
            setRoomData((prev: any) => {
                const updated = prev.map((room: { id: string }) => room.id === roomId ? { ...room, flagged: !flagged } : room);
                filterRoom(statusFilter, typeFilter, updated);
                return updated;
            })
        } catch (err) {
            console.error("Unexpected error while flagging room:", err);
        }
    };

    const handleDisableRoom = async (roomId: any, disabled: boolean, host: string, hostId: string, hostEmail: string, roomName: string) => {
        try {
            const { error: updateError } = await supabase
                .from('thinktank')
                .update({ disabled: !disabled })
                .eq('id', roomId)
            if (updateError) {
                notify({ type: "error", message: `${disabled ? "Error: Unable to enable the room." : `Error: Unable to disable the room. ${updateError.message}`}` })
                console.error(`${disabled ? "Failed to enable room" : "Failed to disable room"}`, updateError);
                return;
            }
            logContentAction.onDisabled(disabled, roomId, "Collab Room", host, hostId);
            try {

                const message = disabled
                    ? `Your Collab Room "${roomName}" is now re-enabled.`
                    : `Your Collab Room "${roomName}" has been disabled due to a violation of our community guidelines`;

                const actionUrl = "";

                const notificationFn = disabled ? roomEnableNotification : roomDisableNotification;
                await notificationFn(adminProfile.profileId, hostId, message, actionUrl, hostEmail, roomName);

            } catch (error) {
                notify({ type: "error", message: `${disabled ? "Error: Unable to enable the room." : `Error: Unable to disable the room.`}` })
                console.error(`${disabled ? "Failed to enable room" : "Failed to disable room"}`, error);
                return;
            }
            notify({ type: "success", message: `${disabled ? "Room has been enabled." : "Room has been disabled."} ` });
            setRoomData((prev: any) => {
                const updated = prev.map((room: { id: string }) => room.id === roomId ? { ...room, disabled: !disabled } : room);
                filterRoom(statusFilter, typeFilter, updated);
                return updated;
            })
        } catch (err) {
            console.error("Unexpected error while disabling room:", err);
        }
    };

    const getStatusColor = (status: any) => {
        switch (status) {
            case 'active': return 'green';
            case 'upcoming': return 'blue';
            case 'past': return 'volcano';
            default: return 'volcano';
        }
    };

    const getTypeColor = (type: any) => {
        switch (type) {
            case 'soundscape': return 'purple';
            case 'think_tank': return 'orange';
            case 'art_exhibit': return 'magenta';
            case 'Service-Based Room': return 'cyan';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'Room Details',
            dataIndex: 'roomDetails',
            key: 'roomDetails',
            width: 300,
            render: (text: any, record: any) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{record.name}</span>
                        {record.flagged && <IoFlagOutline style={{ color: '#ef4444', fontSize: '16px' }} />}
                        {record.disabled && <StopOutlined style={{ color: '#6b7280', fontSize: '16px' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
                        <Tag color={getTypeColor(record.type)}>{record.type}</Tag>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', wordBreak: "break-all" }}>
                        {record.description}
                    </p>
                </div>
            )
        },
        {
            title: 'Host',
            dataIndex: 'host',
            key: 'host',
            render: (text: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{record.host}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.hostEmail}</div>
                </div>
            )
        },
        {
            title: 'Guests',
            dataIndex: 'guests',
            key: 'guests',
            render: (text: any, record: any) => (
                <div>
                    <div style={{ fontSize: '14px' }}>
                        {record.guestCount}{record.maxGuests && ` / ${record.maxGuests}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {record.ticketsSold} tickets sold
                    </div>
                </div>
            )
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (text: any, record: any) => (
                <div>
                    <div style={{ fontSize: '14px' }}>
                        ${record.revenue}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        +${record.donations} donations
                    </div>
                </div>
            )
        },
        {
            title: 'Schedule',
            dataIndex: 'schedule',
            key: 'schedule',
            render: (text: any, record: any) => (
                <div>
                    <div style={{ fontSize: '14px' }}>
                        {dayjs(record.startTime).format("MMMM D, YYYY")}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        to {dayjs(record.endTime).format("MMMM D, YYYY")}
                    </div>
                </div>
            )
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            render: (text: any, record: any) => (
                <Space>
                    <Button
                        type={record.flagged ? "primary" : "default"}
                        danger={record.flagged}
                        icon={<IoFlagOutline />}
                        size="small"
                        onClick={() => handleFlagRoom(record.id, record.flagged, record.host, record.hostId, record.hostEmail, record.name)}
                        title={record.flagged ? 'Unflag room' : 'Flag room'}
                    />
                    <Button
                        type={record.disabled ? "primary" : "default"}
                        icon={<StopOutlined />}
                        size="small"
                        onClick={() => handleDisableRoom(record.id, record.disabled, record.host, record.hostId, record.hostEmail, record.name)}
                        title={record.disabled ? 'Enable room' : 'Disable room'}
                        style={{
                            backgroundColor: record.disabled ? '#10b981' : undefined,
                            borderColor: record.disabled ? '#10b981' : undefined,
                            color: record.disabled ? 'white' : undefined
                        }}
                    />
                    {/* <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        title="View details"
                    /> */}
                </Space>
            )
        }
    ];

    const dataSource = filteredRooms.map((room: any) => ({
        key: room.id,
        id: room.id,
        name: room.title,
        type: room.room_type,
        status: room.status,
        host: room.hostData?.userName || `${room.hostData?.firstName} ${room.hostData?.lastName}`,
        hostId: room.hostData?.userId,
        hostEmail: room.hostData?.email || '',
        guestCount: room.guests || 0,
        maxGuests: room.participant_limit,
        ticketsSold: room.ticketSold,
        revenue: room.roomRevenue,
        donations: room.donations,
        startTime: room.start_datetime,
        endTime: room.end_datetime,
        flagged: room.flagged || false,
        disabled: room.disabled || false,
        description: room.description || ''
    }));

    return (
        <div className={style.container}>
            <div className={style.statsContainer}>
                <div className={style.statsCardContainer}>
                    {/* Stats Cards */}
                    <div className={style.statsCard}>
                        <div className={style.statsCardDiv}>
                            <div className={`${style.iconDiv} ${style.blueIcon}`}>
                                <CalendarOutlined className={style.statsCardIcon} />
                            </div>
                            <div>
                                <span className={style.statsCardTitle}>Total Rooms</span>
                                <span className={style.statsCardValue}>{roomData.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className={style.statsCard}>
                        <div className={style.statsCardDiv}>
                            <div className={`${style.iconDiv} ${style.greenIcon}`}>
                                <LuUsers className={style.statsCardIcon} />
                            </div>
                            <div>
                                <span className={style.statsCardTitle}>Active Rooms</span>
                                <span className={style.statsCardValue}>
                                    {roomData.filter((r: any) => r.status === 'active').length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={style.statsCard}>
                        <div className={style.statsCardDiv}>
                            <div className={`${style.iconDiv} ${style.yellowIcon}`}>
                                <FaDollarSign className={style.statsCardIcon} />
                            </div>
                            <div>
                                <span className={style.statsCardTitle}>Total Revenue</span>
                                <span className={style.statsCardValue}>
                                    ${roomData.reduce((sum: any, room: any) => sum + (room.roomRevenue + room.donations), 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={style.statsCard}>
                        <div className={style.statsCardDiv}>
                            <div className={`${style.iconDiv} ${style.redIcon}`}>
                                <WarningOutlined className={style.statsCardIcon} />
                            </div>
                            <div>
                                <span className={style.statsCardTitle}>Flagged Rooms</span>
                                <span className={style.statsCardValue}>
                                    {roomData.filter((r: any) => r.flagged).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Filters and Search */}
                <div className={style.filterContainer}>
                    <Select
                        allowClear
                        onChange={handleStatusFilter}
                        style={{ width: 200 }}
                        placeholder="Select Status"
                        onClear={() => handleStatusFilter('')}
                    >
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="upcoming">Upcoming</Select.Option>
                        <Select.Option value="past">Past</Select.Option>
                        <Select.Option value="flagged">Flagged</Select.Option>
                        <Select.Option value="disabled">Disabled</Select.Option>
                    </Select>

                    <Select
                        allowClear
                        onChange={handleTypeFilter}
                        style={{ width: 200 }}
                        placeholder="Select Type"
                        onClear={() => handleTypeFilter('')}
                    >
                        <Select.Option value="soundscape">Soundscape</Select.Option>
                        <Select.Option value="think_tank">Think Tank</Select.Option>
                        <Select.Option value="art_exhibit">Art Exhibit</Select.Option>
                    </Select>
                </div>
            </div>

            {/* Rooms List with Ant Design Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1f2937' }}>
                        Rooms ({filteredRooms.length})
                    </h2>
                </div>
                <Card>
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                        }}
                        scroll={{ x: 1200 }}
                        rowClassName={(record) => record.disabled ? style.disabledRow : ''}
                        locale={{
                            emptyText: (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <div style={{ color: '#6b7280' }}>No rooms found matching your criteria.</div>
                                </div>
                            )
                        }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default CollabRoomManagement;