'use client'

import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Filter, Search, TrendingUp, Calendar, User, DollarSign } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './styles.css';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { Skeleton, Modal } from 'antd';
import OrderDetail from './OrderInfo/OrderDetail';

interface Order {
    id: string;
    projectName: string;
    visionaryName: string;
    status: 'active' | 'completed' | 'pending' | 'rejected';
    amount: number;
    startDate: string;
    deadline: string;
    progress: number;
    category: string;
    originalStatus: string;
    otherPartyId: string;
}

interface OrderDataInterface {
    orderId: string;
    orderName: string;
    orderDescription: string;
    startData: string;
    deadline: string;
    clientName?: string;
    visionaryName?: string;
    amount: number;
    status: string;
    rating?: number;
    milestone?: any[];
}

interface OrderStats {
    totalAmount: number;
    activeProjects: number;
    pendingProjects: number;
    completedOrders: number;
}

const OrdersPage = () => {
    const router = useRouter();
    const [loadingData, setLoadingData] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderStats, setOrderStats] = useState<OrderStats>({
        totalAmount: 0,
        activeProjects: 0,
        pendingProjects: 0,
        completedOrders: 0
    });
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const profile = useAppSelector((state) => state.auth);

    const mapStatus = (status: string): 'active' | 'completed' | 'pending' | 'rejected' => {
        switch (status) {
            case 'Accepted': return 'active';
            case 'Approved': return 'completed';
            case 'Pending': return 'pending';
            case 'Rejected': return 'rejected';
            default: return 'active';
        }
    };

    const getOrderDetails = async (profileId: string, profileType: string) => {
        try {
            setLoadingData(true);

            const filterColumn = profileType === 'client' ? 'client_id' : 'visionary_id';
            const otherPartyColumn = profileType === 'client' ? 'visionary_id' : 'client_id';

            const { data: serviceOrderData, error: serviceOrderFetchError } = await supabase
                .from('service_orders')
                .select(`
                    id, 
                    service_name, 
                    package_name, 
                    deadline, 
                    created_at, 
                    amount, 
                    status, 
                    review,
                    client_id,
                    visionary_id
                `)
                .eq(filterColumn, profileId);

            if (serviceOrderFetchError) {
                console.error("Error fetching service orders: ", serviceOrderFetchError);
                return;
            }

            const { data: orderData, error: orderFetchError } = await supabase
                .from('order')
                .select(`
                    id, 
                    title, 
                    description, 
                    start_datetime, 
                    end_datetime, 
                    price, 
                    status, 
                    review,
                    client_id,
                    visionary_id,
                    created_at,
                    milestone
                `)
                .eq(filterColumn, profileId);

            if (orderFetchError) {
                console.error("Error fetching orders: ", orderFetchError);
                return;
            }

            const otherPartyIds = [
                ...serviceOrderData?.map(order => order[otherPartyColumn]) || [],
                ...orderData?.map(order => order[otherPartyColumn]) || []
            ].filter(Boolean);

            const { data: otherPartyDetails, error: otherPartyError } = await supabase
                .from('users')
                .select("userId, firstName, lastName")
                .in("userId", otherPartyIds);

            if (otherPartyError) {
                console.error("Error fetching other party details: ", otherPartyError);
                return;
            }

            const otherPartyMap = otherPartyDetails?.reduce((acc, user) => {
                acc[user.userId] = `${user.firstName} ${user.lastName}`;
                return acc;
            }, {} as Record<string, string>) || {};

            const processedOrders: Order[] = [
                ...(serviceOrderData?.map(order => ({
                    id: order.id,
                    projectName: order.service_name,
                    visionaryName: otherPartyMap[order[otherPartyColumn]] || 'Unknown',
                    status: mapStatus(order.status),
                    amount: order.amount,
                    startDate: order.created_at,
                    deadline: order.deadline,
                    progress: order.status === 'Approved' ? 100 : (order.status === 'Accepted' ? 50 : 0),
                    category: 'Service',
                    originalStatus: order.status,
                    otherPartyId: order[otherPartyColumn]
                })) || []),
                ...(orderData?.map(order => {
                    const lastMilestone = (order?.milestone && Array.isArray(order.milestone)) && order.milestone[order.milestone.length - 1];
                    const status = mapStatus(order.status);
                    return {
                        id: order.id,
                        projectName: order.title,
                        visionaryName: otherPartyMap[order[otherPartyColumn]] || 'Unknown',
                        status: status,
                        amount: order.price,
                        startDate: order.start_datetime || order.created_at,
                        deadline: lastMilestone ? lastMilestone.dueDate : order.end_datetime,
                        progress: status === 'completed' ? 100 : (status === 'active' ? 50 : 0),
                        category: 'Project',
                        originalStatus: order.status,
                        otherPartyId: order[otherPartyColumn]
                    }
                }) || [])
            ];

            const stats: OrderStats = {
                totalAmount: processedOrders
                    .filter(order => order.status === 'completed')
                    .reduce((sum, order) => sum + order.amount, 0),
                activeProjects: processedOrders.filter(order => order.status === 'active').length,
                pendingProjects: processedOrders.filter(order => order.status === 'pending').length,
                completedOrders: processedOrders.filter(order => order.status === 'completed').length
            };

            setOrders(processedOrders);
            setOrderStats(stats);

        } catch (error) {
            console.error("Unexpected Error while getting orders: ", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (profile.profileId) {
            getOrderDetails(profile.profileId, profile.profileType!);
        }
    }, [profile]);

    const stats = [
        { label: profile?.profileType === 'client' ? 'Total Spent' : 'Total Earnings', value: `$${orderStats.totalAmount.toLocaleString()}`, icon: DollarSign, color: 'green' },
        { label: 'Active Projects', value: orderStats.activeProjects.toString(), icon: Package, color: 'blue' },
        { label: 'Pending', value: orderStats.pendingProjects.toString(), icon: Clock, color: 'orange' },
        { label: 'Completed', value: orderStats.completedOrders.toString(), icon: CheckCircle, color: 'cyan' }
    ];

    const filteredOrders = orders.filter(order => {
        const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
        const matchesSearch = order.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.visionaryName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return { label: 'In Progress', color: 'blue', icon: TrendingUp };
            case 'completed':
                return { label: 'Completed', color: 'green', icon: CheckCircle };
            case 'pending':
                return { label: 'Pending', color: 'orange', icon: Clock };
            case 'rejected':
                return { label: 'Rejected', color: 'red', icon: XCircle };
            default:
                return { label: status, color: 'gray', icon: Package };
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const handleMessage = async (order: Order) => {
        const participantId = order.otherPartyId;
        const profileId = profile.profileId;

        if (!participantId || !profileId) return;

        try {
            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('id')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            let convId;
            if (existingConversation) {
                convId = existingConversation.id;
            } else {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                convId = newConversation.id;
            }

            if (profile.profileType === 'client') {
                router.push(`/dashboard/client/messages?cnv=${convId}&ch=${participantId}`);
            } else {
                router.push(`/messages/room/${convId}?ch=${participantId}`);
            }
        } catch (error) {
            console.error("Error creating/finding conversation:", error);
        }
    };

    if (loadingData) {
        return (
            <div className="orders-page">
                <div className="orders-container">
                    <Skeleton active />
                    <Skeleton active />
                    <Skeleton active />
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="floating-orb orb-1"></div>
            <div className="floating-orb orb-2"></div>
            <div className="floating-orb orb-3"></div>

            <div className="orders-container">
                <button
                    onClick={() => router.push(`/dashboard/${profile.profileType?.toLowerCase()}`)}
                    className="back-button"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>

                <div className="orders-header">
                    <div className="header-content">
                        <h1 className="orders-title">Order Management</h1>
                        <p className="orders-subtitle">Track and manage all your project collaborations</p>
                    </div>
                </div>

                <div className="stats-overview">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className={`stat-card stat-${stat.color}`}>
                                <div className="stat-icon-wrapper">
                                    <Icon size={24} />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="orders-controls">
                    <div className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            <Filter size={16} />
                            All Orders
                        </button>
                        <button
                            className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('active')}
                        >
                            Active
                        </button>
                        <button
                            className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('completed')}
                        >
                            Completed
                        </button>
                    </div>
                </div>

                <div className="orders-grid">
                    {filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div key={order.id} className="order-card">
                                <div className="order-card-header">
                                    <div className="order-info-card">
                                        <h3 className="order-title">{order.projectName}</h3>
                                        <div className="order-meta">
                                            <User size={14} />
                                            <span>{order.visionaryName}</span>
                                        </div>
                                    </div>
                                    <div className={`order-status status-${statusConfig.color}`}>
                                        <StatusIcon size={16} />
                                        <span>{statusConfig.label}</span>
                                    </div>
                                </div>

                                <div className="order-details">
                                    <div className="detail-row">
                                        <div className="detail-item">
                                            <Calendar size={16} />
                                            <span>Start: {new Date(order.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <Clock size={16} />
                                            <span>Due: {new Date(order.deadline).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <div className="detail-item">
                                            <DollarSign size={16} />
                                            <span className="amount">${order.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="category-badge">{order.category}</div>
                                    </div>
                                </div>

                                {order.status === 'active' && (
                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span className="progress-label">Progress</span>
                                            <span className="progress-value">{order.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${order.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                <div className="order-actions">
                                    <button className="action-btn primary" onClick={() => handleViewDetails(order)}>View Details</button>
                                    <button className="action-btn secondary" onClick={() => handleMessage(order)}>Message</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredOrders.length === 0 && (
                    <div className="empty-state">
                        <Package size={64} className="empty-icon" />
                        <h3>No orders found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            <Modal
                title={<span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '600' }}>Order Details</span>}
                open={showDetailModal}
                onCancel={() => setShowDetailModal(false)}
                footer={null}
                width={1000}
                centered
                styles={{
                    mask: { backdropFilter: 'blur(10px)' },
                    content: {
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        padding: '2rem'
                    },
                    header: {
                        background: 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '1.5rem',
                        paddingBottom: '1rem'
                    }
                }}
            >
                {selectedOrder && (
                    <OrderDetail
                        orderName={selectedOrder.projectName}
                        orderDescription={""}
                        orderStartDate={selectedOrder.startDate}
                        orderEndDate={selectedOrder.deadline}
                        orderPrice={selectedOrder.amount}
                        orderStatus={selectedOrder.status === 'completed' ? 'Completed' : (selectedOrder.status === 'active' ? 'Accepted' : (selectedOrder.status === 'pending' ? 'Pending' : 'Rejected'))}
                        orderStatusColor={selectedOrder.status === 'completed' ? 'green' : (selectedOrder.status === 'active' ? 'geekblue' : (selectedOrder.status === 'pending' ? 'gold' : 'red'))}
                        orderId={selectedOrder.id}
                        clientName={profile.profileType === 'client' ? undefined : selectedOrder.visionaryName}
                        visionaryName={profile.profileType === 'client' ? selectedOrder.visionaryName : undefined}
                        userProfile={{
                            profileType: profile.profileType === 'client' ? 'client' : 'Visionary',
                            firstName: profile.firstName || '',
                            lastName: profile.lastName || '',
                            userId: profile.profileId || ''
                        }}
                        isCompleted={selectedOrder.status === 'completed'}
                        completedDate={selectedOrder.status === 'completed' ? selectedOrder.deadline : undefined}
                    />
                )}
            </Modal>
        </div>
    );
};

export default OrdersPage;



