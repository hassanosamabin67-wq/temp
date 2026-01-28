'use client'
import React, { useEffect, useState } from 'react'
import styles from './style.module.css'
import { Card, Skeleton } from 'antd'
import { LuClock } from "react-icons/lu";
import { FiDollarSign, FiAlertCircle } from "react-icons/fi";
import { PiToolbox } from "react-icons/pi";
import OrderInfo from './OrderInfo';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';

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

type OrderStatusType = {
    active: OrderDataInterface[];
    completed: OrderDataInterface[];
    pending: OrderDataInterface[];
    rejected: OrderDataInterface[];
};

interface OrderStats {
    totalAmount: number;
    activeProjects: number;
    pendingProjects: number;
    completedOrders: number;
}

const Orders = () => {
    const [ordersByStatus, setOrdersByStatus] = useState<OrderStatusType>({
        active: [],
        completed: [],
        pending: [],
        rejected: []
    });
    const [loadingData, setLoadingData] = useState(false)
    const [orderStats, setOrderStats] = useState<OrderStats>({
        totalAmount: 0,
        activeProjects: 0,
        pendingProjects: 0,
        completedOrders: 0
    });
    const profile = useAppSelector((state) => state.auth);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <FiDollarSign />;
            case 'accepted': return <FiAlertCircle />;
            case 'approved': return <LuClock />;
            case 'rejected': return <PiToolbox />;
            default: return <LuClock />;
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

            const processedOrders: OrderDataInterface[] = [
                ...(serviceOrderData?.map(order => ({
                    orderId: order.id,
                    orderName: order.service_name,
                    orderDescription: order.package_name,
                    startData: order.created_at,
                    deadline: order.deadline,
                    ...(profileType === 'client'
                        ? { visionaryName: otherPartyMap[order[otherPartyColumn]] }
                        : { clientName: otherPartyMap[order[otherPartyColumn]] }
                    ),
                    amount: order.amount,
                    status: order.status,
                    rating: order.review
                })) || []),
                ...(orderData?.map(order => {
                    const lastMilestone = (order?.milestone && Array.isArray(order.milestone)) && order.milestone[order.milestone.length - 1];
                    return {
                        orderId: order.id,
                        orderName: order.title,
                        orderDescription: order.description,
                        startData: order.start_datetime || order.created_at,
                        deadline: lastMilestone ? lastMilestone.dueDate : order.end_datetime,
                        ...(profileType === 'client'
                            ? { visionaryName: otherPartyMap[order[otherPartyColumn]] }
                            : { clientName: otherPartyMap[order[otherPartyColumn]] }
                        ),
                        amount: order.price,
                        status: order.status,
                        rating: order.review
                    }
                }) || [])
            ];

            const groupedOrders: OrderStatusType = {
                active: processedOrders.filter(order => order.status === 'Accepted'),
                completed: processedOrders.filter(order => order.status === 'Approved'),
                pending: processedOrders.filter(order => order.status === 'Pending'),
                rejected: processedOrders.filter(order => order.status === 'Rejected')
            };

            const stats: OrderStats = {
                totalAmount: processedOrders
                    .filter(order => order.status === 'Approved')
                    .reduce((sum, order) => sum + order.amount, 0),
                activeProjects: groupedOrders.active.length,
                pendingProjects: groupedOrders.pending.length,
                completedOrders: groupedOrders.completed.length
            };

            setOrdersByStatus(groupedOrders);
            setOrderStats(stats);

        } catch (error) {
            console.error("Unexpected Error while getting orders: ", error);
        } finally {
            setLoadingData(false);
        }
    };

    const getAmountLabel = () => {
        return profile?.profileType === 'client' ? 'Total Spent' : 'Total Earnings';
    };

    useEffect(() => {
        getOrderDetails(profile.profileId!, profile.profileType!)
    }, [profile])

    if (loadingData) {
        return (
            <div className={styles.orderHeader}>
                <Skeleton active />
            </div>
        )
    }

    return (
        <div className={styles.ordersMain}>
            <div className={styles.orderHeader}>
                <Card className={styles.orderHeaderCard}>
                    <div className={styles.orderHeaderCardBody}>
                        <div className={styles.iconDiv}>
                            <span className={`${styles.icon} ${styles.dollarIcon}`}><FiDollarSign /></span>
                        </div>
                        <div className={styles.cardInfoDiv}>
                            <span className={styles.infoValue}>${orderStats?.totalAmount}</span>
                            <span className={styles.infoDetail}>{getAmountLabel()}</span>
                        </div>
                    </div>
                </Card>
                <Card className={styles.orderHeaderCard}>
                    <div className={styles.orderHeaderCardBody}>
                        <div className={styles.iconDiv}>
                            <span className={`${styles.icon} ${styles.activeProjectIcon}`}><FiAlertCircle /></span>
                        </div>
                        <div className={styles.cardInfoDiv}>
                            <span className={styles.infoValue}>{orderStats?.activeProjects}</span>
                            <span className={styles.infoDetail}>Active Projects</span>
                        </div>
                    </div>
                </Card>
                <Card className={styles.orderHeaderCard}>
                    <div className={styles.orderHeaderCardBody}>
                        <div className={styles.iconDiv}>
                            <span className={`${styles.icon} ${styles.pendingProjectIcon}`}><LuClock /></span>
                        </div>
                        <div className={styles.cardInfoDiv}>
                            <span className={styles.infoValue}>{orderStats?.pendingProjects}</span>
                            <span className={styles.infoDetail}>Pending Projects</span>
                        </div>
                    </div>
                </Card>
                <Card className={styles.orderHeaderCard}>
                    <div className={styles.orderHeaderCardBody}>
                        <div className={styles.iconDiv}>
                            <span className={`${styles.icon} ${styles.totalOrdersIcon}`}><PiToolbox /></span>
                        </div>
                        <div className={styles.cardInfoDiv}>
                            <span className={styles.infoValue}>{orderStats?.completedOrders}</span>
                            <span className={styles.infoDetail}>
                                {profile.profileType === 'client'
                                    ? 'Total Projects Completed'
                                    : 'Total Orders Completed'
                                }
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
            <OrderInfo ordersByStatus={ordersByStatus} userProfile={profile} />
        </div>
    )
}

export default Orders
