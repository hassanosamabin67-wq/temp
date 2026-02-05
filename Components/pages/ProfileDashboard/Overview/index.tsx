'use client'
import React, { useEffect, useState } from 'react'
import styles from './style.module.css'
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store'
import { Empty } from 'antd';
import RecommendedVisionaries from '../../client/profile/recommended';
import dayjs from 'dayjs';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import {
    Briefcase,
    Bell,
    CreditCard,
    Users,
    TrendingUp,
    Clock,
    DollarSign,
    Folder,
    AlertCircle,
} from 'lucide-react';

type RecentOrder = {
    id: string;
    title: string;
    dateLabel: string;
    status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
    createdAt: string;
};

interface recentPaymentsInterface {
    id: string;
    purchaseName: string;
    transactionDate: string;
    amount: number;
}

interface overviewCardsInterface {
    activeProjects: number;
    totalSpend: number;
    upcomingSessions: number;
}

interface upcomingRoomInterface {
    id: string;
    roomTitle: string;
    roomDescription: string;
    roomTime: string;
    roomDate: string;
    isRecurring: boolean;
}

const Overview = () => {
    const profileRedux = useAppSelector((state) => state.auth);
    const [recentOrders, setRecentOrders] = useState<any>([]);
    const [recentPayment, setRecentPayment] = useState<recentPaymentsInterface[]>([]);
    const [cardStats, setCardStats] = useState<overviewCardsInterface>({
        activeProjects: 0,
        totalSpend: 0,
        upcomingSessions: 0
    });
    const [upcomingRoom, setUpcomingRoom] = useState<upcomingRoomInterface[]>([]);
    const { notifications, unreadCount, markAsRead, handleDelete } = useNotifications();
    const router = useRouter();
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [projectLoading, setProjectLoading] = useState(false)

    const mapStatus = (status: string): 'ACTIVE' | 'PENDING' | 'COMPLETED' => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return 'ACTIVE';
            case 'approved':
                return 'COMPLETED';
            case 'pending':
            default:
                return 'PENDING';
        }
    };

    const getRecentOrders = async (profileId: string, profileType: string) => {
        try {
            setProjectLoading(true)
            const { data: serviceOrderData, error: serviceOrderError } = await supabase
                .from('service_orders')
                .select(`id, service_name, package_name, deadline, created_at, status, updated_at`)
                .eq('client_id', profileId);

            if (serviceOrderError) throw serviceOrderError;

            const { data: orderData, error: orderError } = await supabase
                .from('order')
                .select(`id, title, end_datetime, created_at, status, updated_at`)
                .eq('client_id', profileId);

            if (orderError) throw orderError;

            const normalizedServiceOrders: RecentOrder[] = (serviceOrderData || []).map((order) => ({
                id: order.id,
                title: order.service_name || 'Untitled Service',
                dateLabel: `Due: ${new Date(order.deadline).toLocaleDateString()}`,
                status: mapStatus(order.status),
                createdAt: order.created_at
            }));

            const normalizedOrders: RecentOrder[] = (orderData || []).map((order) => ({
                id: order.id,
                title: order.title || 'Untitled Project',
                dateLabel: order.status === 'Approved'
                    ? `Completed: ${new Date(order.updated_at).toLocaleDateString()}`
                    : `Due: ${new Date(order.end_datetime).toLocaleDateString()}`,
                status: mapStatus(order.status),
                createdAt: order.created_at
            }));
            const allOrders = [...normalizedServiceOrders, ...normalizedOrders];

            allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const uniqueStatuses = new Map<string, RecentOrder>();
            for (const order of allOrders) {
                if (!uniqueStatuses.has(order.status) && ['ACTIVE', 'PENDING', 'COMPLETED'].includes(order.status)) {
                    uniqueStatuses.set(order.status, order);
                }
                if (uniqueStatuses.size === 3) break;
            }

            const recentOrders = Array.from(uniqueStatuses.values());
            setRecentOrders(recentOrders);

            const activeProjectsCount = allOrders.filter(order => order.status === 'ACTIVE').length;
            setCardStats(prev => ({ ...prev, activeProjects: activeProjectsCount }));

        } catch (error) {
            console.error("Unexpected Error while getting orders: ", error);
            return [];
        } finally {
            setProjectLoading(false)
        }
    };

    const getRecentPayments = async (profileId: string) => {
        try {
            setPaymentLoading(true)
            const { data: transactionData, error: transactionError } = await supabase
                .from('transactions')
                .select(`id, purchase_name, amount, client_id, created_at`)
                .eq('client_id', profileId)
                .order('created_at', { ascending: false });

            if (transactionError) {
                console.error("Error fetching transactions: ", transactionError)
                return;
            };

            const normalizedPayments: recentPaymentsInterface[] = (transactionData || []).map((transaction) => ({
                id: transaction.id,
                purchaseName: transaction.purchase_name || 'Untitled Transaction',
                transactionDate: dayjs(transaction.created_at).format("MMM D, YYYY"),
                amount: transaction.amount || 0
            }));

            setRecentPayment(normalizedPayments.slice(0, 4)); // Show only 4 recent payments

            // Calculate total spend for stats
            const totalSpend = transactionData?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
            setCardStats(prev => ({ ...prev, totalSpend }));

        } catch (error) {
            console.error("Unexpected Error while getting payments: ", error);
        } finally {
            setPaymentLoading(false)
        }
    }

    const getUpcomingRooms = async (profileId: string) => {
        try {
            const currentDate = new Date();
            const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()); // Start of today
            const currentDateEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59); // End of today

            // Get rooms where user is a participant
            const { data: getParticipant, error: participantError } = await supabase
                .from("think_tank_participants")
                .select("id, think_tank_id, participant_id")
                .eq('participant_id', profileId)
                .eq('status', "Accepted");

            if (participantError) {
                console.error("Error fetching room participant:", participantError);
                return;
            }

            // Get rooms where user is the host
            const { data: hostRooms, error: hostError } = await supabase
                .from("thinktank")
                .select("id, title, description, start_datetime, end_datetime, recurring, one_time_date")
                .eq('host', profileId);

            if (hostError) {
                console.error("Error fetching host rooms:", hostError);
                return;
            }

            // Get rooms where user is a participant
            let participantRooms: any[] = [];
            if (getParticipant && getParticipant.length > 0) {
                const participantRoomIds = getParticipant.map(p => p.think_tank_id);
                const { data: rooms, error: roomError } = await supabase
                    .from("thinktank")
                    .select("id, title, description, start_datetime, end_datetime, recurring, one_time_date")
                    .in('id', participantRoomIds);

                if (roomError) {
                    console.error("Error fetching participant rooms:", roomError);
                } else {
                    participantRooms = rooms || [];
                }
            }


            // Combine both host and participant rooms (remove duplicates)
            const allRooms = [...(hostRooms || [])];
            participantRooms.forEach(room => {
                if (!allRooms.find(r => r.id === room.id)) {
                    allRooms.push(room);
                }
            });

            // Filter and normalize upcoming rooms for TODAY only
            const todayUpcomingRooms: upcomingRoomInterface[] = [];

            allRooms.forEach(room => {
                let roomDateTime: Date | null = null;
                let isRecurring = false;

                if (room.recurring && room.start_datetime) {
                    // For recurring rooms, use start_datetime
                    roomDateTime = new Date(room.start_datetime);
                    isRecurring = true;
                } else if (room.recurring && room.one_time_date) {
                    // For one-time rooms, use one_time_date
                    roomDateTime = new Date(room.one_time_date);
                    isRecurring = false;
                }

                if (roomDateTime) {
                    const roomDate = new Date(roomDateTime.getFullYear(), roomDateTime.getMonth(), roomDateTime.getDate());

                    if (roomDate.getTime() === currentDateStart.getTime()) {
                        todayUpcomingRooms.push({
                            id: room.id,
                            roomTitle: room.title || 'Untitled Room',
                            roomDescription: room.description.slice(0, 30) + "......" || '',
                            roomTime: dayjs(roomDateTime).format('h:mm A'),
                            roomDate: dayjs(roomDateTime).format('MMM DD, YYYY'),
                            isRecurring
                        });
                    }
                }
            });

            // Sort by time (earliest first) - no limit since we want all today's rooms
            todayUpcomingRooms.sort((a, b) => {
                const timeA = dayjs(`${a.roomDate} ${a.roomTime}`).valueOf();
                const timeB = dayjs(`${b.roomDate} ${b.roomTime}`).valueOf();
                return timeA - timeB;
            });

            setUpcomingRoom(todayUpcomingRooms);

            setCardStats(prev => ({ ...prev, upcomingSessions: todayUpcomingRooms.length }));

        } catch (error) {
            console.error("Unexpected Error:", error);
        }
    }

    useEffect(() => {
        if (profileRedux?.profileId) {
            getRecentOrders(profileRedux.profileId, profileRedux.profileType!);
            getRecentPayments(profileRedux.profileId);
            getUpcomingRooms(profileRedux.profileId);
        }
    }, [profileRedux?.profileId])

    const stats = [
        {
            label: 'Active Projects',
            value: `${cardStats.activeProjects}`,
            icon: Folder,
            color: '#3b82f6',
        },
        {
            label: 'Upcoming Sessions',
            value: `${cardStats.upcomingSessions}`,
            icon: Clock,
            color: '#8b5cf6',
        },
        {
            label: 'Total Spend',
            value: `$${cardStats.totalSpend.toLocaleString()}`,
            icon: DollarSign,
            color: '#10b981',
            highlight: true,
        },
    ];

    return (
        <MaxWidthWrapper withPadding={false} className={styles.dashboard}>
            <div className={styles.floatingOrb + " " + styles.orb1}></div>
            <div className={styles.floatingOrb + " " + styles.orb2}></div>
            <div className={styles.floatingOrb + " " + styles.orb3}></div>

            <div className={styles.dashboardHeader}>
                <span className={styles.pageHeading}>Overview</span>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`${styles.statCard} ${stat.highlight ? styles.statCardHighlight : ''}`}
                        style={{ '--stat-color': stat.color } as React.CSSProperties}
                    >
                        <div className={styles.statIcon}>
                            <stat.icon size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.dashboardSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <Briefcase size={20} />
                            <h2>Recent Projects</h2>
                        </div>
                    </div>
                    <div className={styles.list}>
                        {projectLoading ? (
                            <div className={styles.emptyState}>
                                <p>Loading projects...</p>
                            </div>
                        ) : recentOrders.length > 0 ? recentOrders.map((order: any) => (
                            <div key={order.id} className={styles.item}>
                                <div className={styles.info}>
                                    <div className={styles.name}>{order.title}</div>
                                    <div className={styles.date}>{order.dateLabel}</div>
                                </div>
                                <span className={`${styles.statusBadge} ${order.status === 'ACTIVE' ? styles.statusActive : styles.statusPending}`}>
                                    {order.status}
                                </span>
                            </div>
                        )) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <AlertCircle size={32} />
                                </div>
                                <p>No Recent Projects</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${styles.dashboardSection} ${styles.notificationSection}`}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <Bell size={20} />
                            <h2>Notifications</h2>
                        </div>
                    </div>
                    <div className={`${styles.list} ${styles.scrollableList}`}>
                        {notifications && notifications.length > 0 ? notifications.map((notification) => (
                            <div key={notification.id} className={styles.notificationItem}>
                                <div className={styles.notificationIndicator}></div>
                                <div className={styles.info}>
                                    <p className={styles.description}>{notification.title}</p>
                                    <span className={styles.date}>{dayjs(notification.created_at).format('MMM DD, YYYY')}</span>
                                </div>
                            </div>
                        )) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <AlertCircle size={32} />
                                </div>
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.dashboardSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <CreditCard size={20} />
                            <h2>Recent Payments</h2>
                        </div>
                    </div>
                    <div className={styles.list}>
                        {paymentLoading ? (
                            <div className={styles.emptyState}>
                                <p>Loading payments...</p>
                            </div>
                        ) : recentPayment.length > 0 ? recentPayment.map(payment => (
                            <div key={payment.id} className={styles.item}>
                                <div className={styles.info}>
                                    <div className={styles.description}>{payment.purchaseName}</div>
                                    <div className={styles.date}>{dayjs(payment.transactionDate).format("MMM DD, YYYY")}</div>
                                </div>
                                <div className={styles.amount}>${payment.amount.toLocaleString()}</div>
                            </div>
                        )) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <AlertCircle size={32} />
                                </div>
                                <p>No recent payments</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.dashboardSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <Users size={20} />
                            <h2>Upcoming Rooms</h2>
                        </div>
                    </div>
                    <div className={styles.list}>
                        {upcomingRoom.length > 0 ? upcomingRoom.map((room) => (
                            <div key={room.id} className={styles.item}>
                                <div className={styles.info}>
                                    <div className={styles.name}>{room.roomTitle}</div>
                                    <div className={styles.date}>{room.roomDescription}</div>
                                </div>
                                <button className={styles.joinBtn} onClick={() => router.push(`/think-tank/room/${room.id}`)}>Join</button>
                            </div>
                        )) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <AlertCircle size={32} />
                                </div>
                                <p>No upcoming rooms</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`${styles.dashboardSection} ${styles.fullWidth}`}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <TrendingUp size={20} />
                        <h2>Recommended Visionaries</h2>
                    </div>
                </div>
                <RecommendedVisionaries />
            </div>
        </MaxWidthWrapper>
    )
}

export default Overview
