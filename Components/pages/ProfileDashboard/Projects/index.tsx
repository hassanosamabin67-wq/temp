'use client'
import React, { useState, useEffect } from 'react';
import { Table, Tabs, Button, Avatar, Tag, Empty, Input, MenuProps, Dropdown } from 'antd';
import { MessageOutlined, CheckOutlined, SearchOutlined } from '@ant-design/icons';
import styles from './style.module.css'
import { FiMoreVertical } from 'react-icons/fi';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/navigation';

interface projectInterface {
    key: string;
    projectName: string;
    packageName?: string;
    description?: string;
    visionaryId: string;
    visionaryName: string;
    visionaryAvatar: string;
    status: string;
    nextMilestone?: string;
    dueDate?: string;
    createdAt: string;
}

const Projects = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("")
    const [projectData, setProjectData] = useState<projectInterface[]>([]);
    const profile = useAppSelector((state) => state.auth);
    const [sendMessageLoading, setSendMessageLoading] = useState(false)
    const router = useRouter()

    const handleSendMessage = async (profileId: string, visionaryId: string) => {
        try {
            setSendMessageLoading(true)

            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${visionaryId}),and(user1_id.eq.${visionaryId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let conversationId;

            if (existingConversation) {
                conversationId = existingConversation.id
            }

            if (!existingConversation) {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: visionaryId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                conversationId = newConversation.id;
            }

            router.push(`/messages/room/${conversationId}?ch=${visionaryId}`)

        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setSendMessageLoading(false);
        }
    };

    const getProjectsData = async (profileId: string) => {
        try {
            setLoading(true);

            // Fetch service orders
            const { data: serviceOrderData, error: serviceOrderFetchError } = await supabase
                .from('service_orders')
                .select(`id, service_name, package_name, deadline, created_at, amount, status, visionary_id`)
                .eq("client_id", profileId);

            if (serviceOrderFetchError) {
                console.error("Error fetching service orders: ", serviceOrderFetchError);
                return;
            }

            // Fetch orders
            const { data: orderData, error: orderFetchError } = await supabase
                .from('order')
                .select(`id, title, description, start_datetime, end_datetime, status, visionary_id, created_at, milestone`)
                .eq("client_id", profileId);

            if (orderFetchError) {
                console.error("Error fetching orders: ", orderFetchError);
                return;
            }

            // Get all unique visionary IDs
            const otherPartyIds = [
                ...serviceOrderData?.map(order => order.visionary_id) || [],
                ...orderData?.map(order => order.visionary_id) || []
            ].filter(Boolean);

            const uniqueVisionaryIds = [...new Set(otherPartyIds)];

            // Fetch visionary details
            const { data: visionaryDetail, error: fetchVisionaryDetailError } = await supabase
                .from("users")
                .select("userId, profileImage, firstName, lastName")
                .in("userId", uniqueVisionaryIds);

            if (fetchVisionaryDetailError) {
                console.error("Error fetching Visionary details: ", fetchVisionaryDetailError);
                return;
            }

            // Create a map of visionary details for quick lookup
            const visionaryMap = visionaryDetail?.reduce((acc, visionary) => {
                acc[visionary.userId] = {
                    name: `${visionary.firstName} ${visionary.lastName}`,
                    profileImage: visionary.profileImage || `https://i.pravatar.cc/40?u=${visionary.userId}`
                };
                return acc;
            }, {} as { [key: string]: { name: string; profileImage: string } }) || {};

            // Process service orders
            const processedServiceOrders = serviceOrderData?.map(order => ({
                key: `service-${order.id}`,
                projectName: order.service_name,
                packageName: order.package_name,
                visionaryId: order.visionary_id,
                visionaryName: visionaryMap[order.visionary_id]?.name || 'Unknown Visionary',
                visionaryAvatar: visionaryMap[order.visionary_id]?.profileImage || `https://i.pravatar.cc/40?u=${order.visionary_id}`,
                status: mapStatus(order.status),
                nextMilestone: getNextMilestone(order.status, order.deadline),
                dueDate: order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : undefined,
                createdAt: order.created_at,
            })) || [];

            // Process regular orders
            const processedOrders = orderData?.map(order => ({
                key: `order-${order.id}`,
                projectName: order.title,
                description: order.description,
                visionaryId: order.visionary_id,
                visionaryName: visionaryMap[order.visionary_id]?.name || 'Unknown Visionary',
                visionaryAvatar: visionaryMap[order.visionary_id]?.profileImage || `https://i.pravatar.cc/40?u=${order.visionary_id}`,
                status: mapStatus(order.status),
                nextMilestone: order.milestone && Array.isArray(order.milestone) && order.milestone.length > 0
                    ? order.milestone[0].title
                    : getNextMilestone(order.status),
                dueDate: order.milestone && Array.isArray(order.milestone) && order.milestone.length > 0
                    ? order.milestone[0].dueDate
                    : (order.end_datetime ? new Date(order.end_datetime).toISOString().split('T')[0] : undefined),
                createdAt: order.created_at,
            })) || [];

            // Combine all projects
            const allProjects = [...processedServiceOrders, ...processedOrders];
            setProjectData(allProjects);

        } catch (error) {
            console.error("Unexpected Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenConversation = async (participantId: string, profileId: string) => {
        try {
            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let conversationId;

            if (existingConversation) {
                conversationId = existingConversation.id
            }

            if (!existingConversation) {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                conversationId = newConversation.id;
            }

            router.push(`/dashboard/client/messages?cnv=${conversationId}&ch=${participantId}`)

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    // Helper function to map database status to display status
    const mapStatus = (dbStatus: string) => {
        const statusMap: { [key: string]: string } = {
            'pending': 'Planning',
            'in_progress': 'In Progress',
            'accepted': 'In Progress',
            'approved': 'Completed',
            'draft': 'Draft',
            'on_hold': 'On Hold',
            'rejected': 'Cancelled',
        };
        return statusMap[dbStatus?.toLowerCase()] || 'Draft';
    };

    // Helper function to get next milestone based on status
    const getNextMilestone = (status: string, deadline?: string) => {
        const statusMilestoneMap: { [key: string]: string } = {
            'submitted': 'Awaiting Approval',
            'pending': 'Awaiting Approval',
            'in_progress': 'Work in Progress',
            'accepted': 'Work in Progress',
            'planning': 'Requirements Gathering',
            'approved': 'Project Delivered',
            'on_hold': 'Project Paused',
            'rejected': 'Project Cancelled',
        };
        return statusMilestoneMap[status?.toLowerCase()] || 'Awaiting Approval';
    };

    // Filter projects based on search term
    const filteredProjects = projectData.filter((project: projectInterface) => {
        const searchableText = `${project.projectName} ${project.visionaryName} ${project.packageName || ''} ${project.description || ''}`.toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase().trim());
    });

    // Categorize projects by status
    const categorizedProjects = {
        active: filteredProjects.filter(project =>
            ['In Progress', 'Planning'].includes(project.status)
        ),
        completed: filteredProjects.filter(project =>
            project.status === 'Completed'
        ),
        // drafts: filteredProjects.filter(project =>
        //     ['Draft', 'On Hold', 'Cancelled'].includes(project.status)
        // ),
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'In Progress': 'blue',
            'Planning': 'orange',
            'Completed': 'green',
            'Draft': 'gray',
            'On Hold': 'red',
            'Cancelled': 'volcano',
        };
        return colors[status] || 'default';
    };

    const tableColumns = [
        {
            title: 'Project Name',
            dataIndex: 'projectName',
            key: 'projectName',
            width: 300,
            render: (name: string, record: projectInterface) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontWeight: 500, color: '#1890ff' }}>{name}</span>
                    {record.description ? (
                        <span style={{ color: "#555555", fontSize: 10, fontWeight: 500 }}>
                            Description: {record.description}
                        </span>
                    ) : record.packageName ? (
                        <span style={{ color: "#555555", fontSize: 10, fontWeight: 500 }}>
                            Package: {record.packageName}
                        </span>
                    ) : null}
                </div>
            ),
        },
        {
            title: 'Visionary',
            key: 'visionary',
            width: 200,
            render: (_: any, record: projectInterface) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar
                        src={record.visionaryAvatar}
                        size={32}
                        style={{ backgroundColor: '#1890ff' }}
                    >
                        {record.visionaryName.charAt(0)}
                    </Avatar>
                    <span style={{ fontWeight: 500 }}>
                        {record.visionaryName}
                    </span>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Tag
                    color={getStatusColor(status)}
                    style={{
                        borderRadius: '12px',
                        padding: '2px 12px',
                        fontWeight: 500
                    }}
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Next Milestone',
            key: 'milestone',
            width: 200,
            render: (_: any, record: projectInterface) => (
                <div>
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                        {record.nextMilestone}
                    </div>
                    {record.dueDate && (
                        <div style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            fontWeight: 400
                        }}>
                            Due: {record.dueDate}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: any, record: projectInterface) => {
                const actionMenu: MenuProps['items'] = [
                    // {
                    //     key: '1',
                    //     label: (
                    //         <div style={{
                    //             display: 'flex',
                    //             alignItems: 'center',
                    //             gap: '8px',
                    //             color: '#1890ff',
                    //             fontWeight: 500,
                    //             padding: '4px 8px',
                    //             borderRadius: '6px',
                    //             transition: 'all 0.3s',
                    //         }}>
                    //             <EyeOutlined />
                    //             View
                    //         </div>
                    //     ),
                    // },
                    {
                        key: '1',
                        label: (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#1890ff',
                                fontWeight: 500,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                transition: 'all 0.3s',
                            }} onClick={() => handleSendMessage(profile.profileId!, record.visionaryId)}>
                                <CheckOutlined />
                                Approve
                            </div>
                        ),
                    },
                    {
                        key: '3',
                        label: (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#52c41a',
                                fontWeight: 500,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                transition: 'all 0.3s',
                            }} onClick={() => handleOpenConversation(record.visionaryId, profile.profileId!)}>
                                <MessageOutlined />
                                Message
                            </div>
                        ),
                    },
                ];

                return (
                    <Dropdown menu={{ items: actionMenu }} trigger={['click']}>
                        <Button type="text" icon={<FiMoreVertical />} size="small" />
                    </Dropdown>
                );
            }
        },
    ];

    const getCurrentData = () => {
        return categorizedProjects[activeTab as keyof typeof categorizedProjects] || [];
    };

    const renderEmptyState = () => (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <span style={{
                    fontSize: '16px',
                    color: '#8c8c8c',
                    fontWeight: 500
                }}>
                    No projects yet
                </span>
            }
            style={{ padding: '60px 20px' }}
        >
            <p style={{ borderRadius: '8px', fontWeight: 500, height: '40px', paddingLeft: '24px', paddingRight: '24px', color: "#797979" }}>Hire a visionary to start a Project</p>
        </Empty>
    );

    const tabItems = [
        {
            key: 'active',
            label: (
                <span style={{
                    fontWeight: 500,
                    fontSize: '14px',
                    padding: '4px 8px'
                }}>
                    Active ({categorizedProjects.active.length})
                </span>
            ),
        },
        {
            key: 'completed',
            label: (
                <span style={{
                    fontWeight: 500,
                    fontSize: '14px',
                    padding: '4px 8px'
                }}>
                    Completed ({categorizedProjects.completed.length})
                </span>
            ),
        },
        // {
        //     key: 'drafts',
        //     label: (
        //         <span style={{
        //             fontWeight: 500,
        //             fontSize: '14px',
        //             padding: '4px 8px'
        //         }}>
        //             Drafts ({categorizedProjects.drafts.length})
        //         </span>
        //     ),
        // },
    ];

    // Load projects when component mounts or profile changes
    useEffect(() => {
        if (profile?.profileId) {
            getProjectsData(profile.profileId);
        }
    }, [profile?.profileId]);

    return (
        <div className={styles.projectCardMain}>
            {/* Header */}
            <div style={{
                padding: '24px 24px 0 24px',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: '16px'
                }}>
                    Projects
                </h2>

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <Input
                        placeholder="Search projects, visionaries..."
                        prefix={<SearchOutlined />}
                        style={{ width: 300 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        onClick={() => profile?.profileId && getProjectsData(profile.profileId)}
                        loading={loading}
                        style={{ borderRadius: '6px' }}
                    >
                        Refresh
                    </Button>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                    style={{
                        marginBottom: 0,
                    }}
                />
            </div>

            {/* Table Content */}
            <div style={{ padding: '0' }}>
                {getCurrentData().length === 0 ? (
                    renderEmptyState()
                ) : (
                    <Table
                        columns={tableColumns}
                        dataSource={getCurrentData()}
                        loading={loading}
                        pagination={{
                            total: getCurrentData().length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} projects`,
                            style: {
                                padding: '16px 24px',
                                borderTop: '1px solid #f0f0f0'
                            }
                        }}
                        scroll={{ x: 1000 }}
                        rowHoverable={true}
                        style={{
                            backgroundColor: '#fff'
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Projects;