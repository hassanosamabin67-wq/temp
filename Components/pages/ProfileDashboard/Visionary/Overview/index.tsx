'use client'
import React, { useEffect, useState } from 'react'
import HeaderCard from '@/Components/UIComponents/DashboardOverview/HeaderCard'
import DisplayContainer from '@/Components/UIComponents/DashboardOverview/DisplayContainer'
import { FaClock, FaStar } from 'react-icons/fa'
import { Empty, Tag } from 'antd'
import { MdOutlinePayment } from 'react-icons/md'
import { IoNotifications } from 'react-icons/io5'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase } from '@/config/supabase'
import { useAppSelector } from '@/store'
import styles from './style.module.css'
import { fetchUserAdStats } from '@/utils/adUtils';
import { Button } from 'antd';
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import MySubscriptions from '../../MySubscriptions'
import SubscriptionManagement from '../../SubscriptionManagement'
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper'

interface overviewCardsInterface {
    activeProjects: number;
    totalEarning: number;
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

type ActiveProjects = {
    id: string;
    title: string;
    clientName: string;
    status: 'ACTIVE' | 'PENDING' | 'IN REVIEW';
    dateLabel?: string;
    createdAt?: string;
};

interface earningSummaryInterface {
    monthTotal: number;
    lastMonthTotal: number;
    averageEarning: number;
    pendingPayout: number;
}

interface adStatsInterface {
    totalAds: number;
    totalImpressions: number;
    totalSpent: number;
}

const DashboardOverview = () => {
    const router = useRouter();
    const { notifications } = useNotifications();
    const [activeProjects, setAciveProjects] = useState<ActiveProjects[]>([]);
    const [projectLoading, setProjectLoading] = useState(false)
    const [upcomingRoom, setUpcomingRoom] = useState<any[]>([]);
    const [cardStats, setCardStats] = useState<overviewCardsInterface>({
        activeProjects: 0,
        totalEarning: 0,
        upcomingSessions: 0
    });
    const profileRedux = useAppSelector((state) => state.auth);
    const [earningSummary, setEarningSummary] = useState<earningSummaryInterface>({
        monthTotal: 0,
        lastMonthTotal: 0,
        averageEarning: 0,
        pendingPayout: 0,
    });
    const [earningLoading, setEarningLoading] = useState(false);
    const [adStats, setAdStats] = useState<adStatsInterface>({
        totalAds: 0,
        totalImpressions: 0,
        totalSpent: 0
    });
    const [adStatsLoading, setAdStatsLoading] = useState(false);

    const mapStatus = (status: string): 'ACTIVE' | 'PENDING' | 'IN REVIEW' | null => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return 'ACTIVE';
            case 'submitted':
                return 'IN REVIEW';
            case 'pending':
                return 'PENDING';
            case 'approved':
                return null;
            default:
                return 'PENDING';
        }
    };

    const getActiveProjects = async (profileId: string) => {
        try {
            setProjectLoading(true);

            const { data: serviceOrderData, error: serviceOrderError } = await supabase
                .from('service_orders')
                .select(`id, service_name, package_name, deadline,  created_at, status, client_id,
                    users!service_orders_client_id_fkey(userId, firstName, lastName)`)
                .eq('visionary_id', profileId)
                .neq('status', 'Approved');

            if (serviceOrderError) throw serviceOrderError;


            const { data: orderData, error: orderError } = await supabase
                .from('order')
                .select(`id, title, end_datetime, created_at, status, client_id,updated_at,
                users!order_client_id_fkey(userId, firstName, lastName)`)
                .eq('visionary_id', profileId)
                .neq('status', 'Approved');

            if (orderError) throw orderError;

            const normalizedServiceOrders: ActiveProjects[] = (serviceOrderData || [])
                .map((order: any) => {
                    const mappedStatus = mapStatus(order.status);
                    if (!mappedStatus) return null;
                    const clientName = order.users ? `${order.users.firstName || ''} ${order.users.lastName || ''}`.trim() : 'Unknown Client';
                    return {
                        id: order.id,
                        title: order.service_name || 'Untitled Service',
                        clientName,
                        status: mappedStatus,
                        dateLabel: order.deadline
                            ? `Due: ${new Date(order.deadline).toLocaleDateString()}`
                            : `Created: ${new Date(order.created_at).toLocaleDateString()}`,
                        createdAt: order.created_at
                    };
                })
                .filter((order) => order !== null);

            const normalizedOrders: ActiveProjects[] = (orderData || [])
                .map((order: any) => {
                    const mappedStatus = mapStatus(order.status);
                    if (!mappedStatus) return null;
                    const clientName = order.users ? `${order.users.firstName || ''} ${order.users.lastName || ''}`.trim() : 'Unknown Client';
                    return {
                        id: order.id,
                        title: order.title || 'Untitled Project',
                        clientName,
                        dateLabel: order.status === 'Completed'
                            ? `Completed: ${new Date(order.updated_at).toLocaleDateString()}`
                            : `Due: ${new Date(order.end_datetime).toLocaleDateString()}`,
                        status: mappedStatus,
                        createdAt: order.created_at
                    };
                })
                .filter((order) => order !== null);

            const allOrders = [...normalizedServiceOrders, ...normalizedOrders];
            const uniqueStatuses = new Map<string, ActiveProjects>();
            const allowedStatuses = ['ACTIVE', 'PENDING', 'IN REVIEW'];

            for (const order of allOrders) {
                if (!uniqueStatuses.has(order.status) && allowedStatuses.includes(order.status)) {
                    uniqueStatuses.set(order.status, order);
                }
                if (uniqueStatuses.size === 3) break;
            }

            const recentOrders = Array.from(uniqueStatuses.values());
            setAciveProjects(recentOrders);

            // const activeProjectsCount = allOrders.filter(order => order.status === 'ACTIVE').length;
            const activeProjectsCount = recentOrders.length;
            setCardStats(prev => ({ ...prev, activeProjects: activeProjectsCount }));

        } catch (error) {
            console.error("Unexpected Error while getting orders: ", error);
            return [];
        } finally {
            setProjectLoading(false);
        }
    };

    const getUpcomingRooms = async (profileId: string) => {
        try {
            const currentDate = new Date();
            const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

            const { data: getParticipant, error: participantError } = await supabase
                .from("think_tank_participants")
                .select("id, think_tank_id, participant_id")
                .eq('participant_id', profileId)
                .eq('status', "Accepted");

            if (participantError) {
                console.error("Error fetching room participant:", participantError);
                return;
            }

            const { data: hostRooms, error: hostError } = await supabase
                .from("thinktank")
                .select("id, title, description, start_datetime, end_datetime, recurring, one_time_date")
                .eq('host', profileId);

            if (hostError) {
                console.error("Error fetching host rooms:", hostError);
                return;
            }
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

            const allRooms = [...(hostRooms || [])];
            participantRooms.forEach(room => {
                if (!allRooms.find(r => r.id === room.id)) {
                    allRooms.push(room);
                }
            });

            const todayUpcomingRooms: upcomingRoomInterface[] = [];

            allRooms.forEach(room => {
                let roomDateTime: Date | null = null;
                let isRecurring = false;

                if (room.recurring && room.start_datetime) {
                    roomDateTime = new Date(room.start_datetime);
                    isRecurring = true;
                } else if (room.recurring && room.one_time_date) {
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

    const getEarningsSummary = async (profileId: string) => {
        try {
            setEarningLoading(true)
            const { data: serviceOrders, error: soErr } = await supabase
                .from('service_orders')
                .select('id, amount, tip_price, status, created_at')
                .eq('visionary_id', profileId);

            if (soErr) throw soErr;

            const { data: projectOrders, error: oErr } = await supabase
                .from('order')
                .select('id, price, tip_price, status, created_at')
                .eq('visionary_id', profileId);

            if (oErr) throw oErr;

            // Normalize into a single array of entries with value + date + status
            type Entry = { value: number; created_at: string; status: string };
            const entriesSO: Entry[] = (serviceOrders || []).map((r: any) => ({
                value: (Number(r?.amount) || 0) + (Number(r?.tip_price) || 0),
                created_at: r?.created_at,
                status: String(r?.status || '').toLowerCase(),
            }));

            const entriesOrder: Entry[] = (projectOrders || []).map((r: any) => ({
                value: (Number(r?.price) || 0) + (Number(r?.tip_price) || 0),
                created_at: r?.created_at,
                status: String(r?.status || '').toLowerCase(),
            }));

            const all: Entry[] = [...entriesSO, ...entriesOrder].filter(e => e.created_at);

            // Status buckets (adjust to your exact workflow if needed)
            const COMPLETED = new Set(['approved']);
            const PENDING = new Set(['submitted']);

            // Time ranges
            const now = dayjs();
            const startOfThisMonth = now.startOf('month');
            const endOfThisMonth = now.endOf('month');

            const startOfLastMonth = startOfThisMonth.subtract(1, 'month');
            const endOfLastMonth = startOfThisMonth.subtract(1, 'second'); // last moment of prev month

            // Helper to test if created_at in [start, end]
            const inRange = (d: string, start: dayjs.Dayjs, end: dayjs.Dayjs) =>
                dayjs(d).isAfter(start.subtract(1, 'millisecond')) && dayjs(d).isBefore(end.add(1, 'millisecond'));

            // Completed-only sums
            const completed = all.filter(e => COMPLETED.has(e.status));

            const totalEarning = completed.reduce((sum, e) => sum + e.value, 0);

            const monthTotal = completed
                .filter(e => inRange(e.created_at, startOfThisMonth, endOfThisMonth))
                .reduce((sum, e) => sum + e.value, 0);

            const lastMonthTotal = completed
                .filter(e => inRange(e.created_at, startOfLastMonth, endOfLastMonth))
                .reduce((sum, e) => sum + e.value, 0);

            // Average earning over the last 3 months (including current)
            const monthKeys: string[] = [
                now.startOf('month').format('YYYY-MM'),
                now.startOf('month').subtract(1, 'month').format('YYYY-MM'),
                now.startOf('month').subtract(2, 'month').format('YYYY-MM'),
            ];

            const totalsByMonth: Record<string, number> = { [monthKeys[0]]: 0, [monthKeys[1]]: 0, [monthKeys[2]]: 0 };

            completed.forEach(e => {
                const key = dayjs(e.created_at).format('YYYY-MM');
                if (key in totalsByMonth) totalsByMonth[key] += e.value;
            });

            const averageEarning =
                monthKeys.reduce((s, k) => s + (totalsByMonth[k] || 0), 0) / monthKeys.length;

            // Pending payout = pending-like statuses (not completed)
            const pendingPayout = all
                .filter(e => PENDING.has(e.status))
                .reduce((sum, e) => sum + e.value, 0);

            // Push into state used by cards & list
            setEarningSummary({
                monthTotal: Math.round(monthTotal),
                lastMonthTotal: Math.round(lastMonthTotal),
                averageEarning: Math.round(averageEarning),
                pendingPayout: Math.round(pendingPayout),
            });

            // Update your top cards as well (Total Earnings)
            setCardStats(prev => ({ ...prev, totalEarning: Math.round(totalEarning) }));
        } catch (err) {
            console.error('Error computing earnings summary:', err);
        } finally {
            setEarningLoading(false)
        }
    };

    const getAdStats = async (profileId: string) => {
        try {
            setAdStatsLoading(true);
            const stats = await fetchUserAdStats(profileId);
            if (stats) {
                setAdStats({
                    totalAds: stats.totalAds,
                    totalImpressions: stats.totalImpressions,
                    totalSpent: stats.totalSpent
                });
            }
        } catch (error) {
            console.error("Error fetching ad stats:", error);
        } finally {
            setAdStatsLoading(false);
        }
    };

    useEffect(() => {
        if (profileRedux?.profileId) {
            getActiveProjects(profileRedux.profileId);
            getUpcomingRooms(profileRedux.profileId);
            getEarningsSummary(profileRedux.profileId);
            getAdStats(profileRedux.profileId);
        }
    }, [profileRedux?.profileId]);

    return (
        <MaxWidthWrapper withPadding={false} className={styles.dashboard}>
            <span className={styles.pageHeading}>Overview</span>
            <div className={styles.statsGrid}>
                <HeaderCard cardLabel='Active Projects' cardValue={`${cardStats.activeProjects}`} />
                <HeaderCard cardLabel='Upcoming Sessions' cardValue={`${cardStats.upcomingSessions}`} />
                <HeaderCard cardLabel='Total Earnings' cardValue={`$${cardStats.totalEarning.toLocaleString()}`} isPrice={true} />
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.mainContent}>
                    <DisplayContainer
                        Icon={<FaClock />}
                        title="Active Projects"
                        items={
                            activeProjects.map((project) => (
                                <div key={project.id} className={styles.cardItem}>
                                    <div className={styles.cardInfo}>
                                        <div className={styles.projectName}>{project.title}</div>
                                        <div className={styles.projectMeta}>Client: {project.clientName}</div>
                                    </div>
                                    <Tag
                                        className={styles.projectStatus}
                                        color={
                                            project.status === 'ACTIVE' ? 'green' :
                                                project.status === 'PENDING' ? 'gold' :
                                                    'geekblue'
                                        }
                                    >
                                        {project.status}
                                    </Tag>
                                </div>
                            ))
                        }
                        emptyDescription='No Active Projects'
                        loadingState={projectLoading}
                    />
                    <DisplayContainer
                        Icon={<MdOutlinePayment />}
                        title="Earnings Summary"
                        items={[
                            <div className={styles.cardItem} key="total-this-month">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Total This Month:</div>
                                    <span className={styles.earningValue}>${earningSummary.monthTotal.toLocaleString()}</span>
                                </div>
                            </div>,
                            <div className={styles.cardItem} key="pending-payout">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Pending Payout:</div>
                                    <span className={`${styles.earningValue} ${styles.pendingAmount}`}>${earningSummary.pendingPayout.toLocaleString()}</span>
                                </div>
                            </div>,
                            <div className={styles.cardItem} key="last-month-total">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Last Month Total:</div>
                                    <span className={styles.earningValue}>${earningSummary.lastMonthTotal.toLocaleString()}</span>
                                </div>
                            </div>,
                            <div className={styles.cardItem} key="average-earning">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Average Earning:</div>
                                    <span className={styles.earningValue}>${earningSummary.averageEarning.toLocaleString()}</span>
                                </div>
                            </div>
                        ]}
                        loadingState={earningLoading}
                    />
                    {/* <!-- Advertisement Details --> */}
                    <DisplayContainer
                        Icon={<MdOutlinePayment />}
                        title="Advertisement Details"
                        items={[
                            <div className={styles.cardItem} key="total-ads">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Total Ads Purchased:</div>
                                    <span className={styles.earningValue}>{adStats.totalAds}</span>
                                </div>
                            </div>,
                            <div className={styles.cardItem} key="total-impressions">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Total Impressions (Replay):</div>
                                    <span className={styles.earningValue}>{adStats.totalImpressions.toLocaleString()}</span>
                                </div>
                            </div>,
                            <div className={styles.cardItem} key="total-spent">
                                <div className={`${styles.cardInfo} ${styles.earningItems}`}>
                                    <div className={styles.earningKey}>Total Spent:</div>
                                    <span className={styles.earningValue}>${adStats.totalSpent.toLocaleString()}</span>
                                </div>
                            </div>,
                            <div className={styles.cardItem} key="action-buttons">
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '10px 0' }}>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        size="middle"
                                        onClick={() => router.push('/dashboard/visionary/ads')}
                                    >
                                        Upload New Ad
                                    </Button>
                                    <Button
                                        icon={<UnorderedListOutlined />}
                                        size="middle"
                                        onClick={() => router.push('/dashboard/visionary/ads')}
                                    >
                                        View My Ads
                                    </Button>
                                </div>
                            </div>
                        ]}
                        loadingState={adStatsLoading}
                    />
                </div>

                <div className={styles.sidebarContent}>
                    {/* <!-- Notifications --> */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                <IoNotifications />
                                Notifications
                            </h2>
                        </div>
                        <div className={styles.scrollContainer}>
                            {notifications && notifications.length > 0 ? notifications.map((notification) => (
                                <div key={notification.id} className={`${styles.notificationItem} ${!notification.is_read ? styles.notificationUnread : ""}`}>
                                    <div className={styles.notificationText}>{notification.title}</div>
                                    <div className={styles.notificationTime}>{dayjs(notification.created_at).format('MMM DD, YYYY')}</div>
                                </div>
                            )) : (
                                <div className={styles.emptyState}>
                                    <Empty description='No notifications' />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* <!-- Upcoming Rooms --> */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                <FaStar />
                                Upcoming Rooms
                            </h2>
                        </div>
                        <div className={styles.scrollContainer}>
                            {upcomingRoom.length > 0 ? upcomingRoom.map((room) => (
                                <div key={room.id} className={styles.roomItem}>
                                    {/* <div className={styles.roomTime}>
                                    {room.roomDate}
                                    </div> */}
                                    <div className={styles.roomInfo}>
                                        <div className={styles.roomTitle}>{room.roomTitle}</div>
                                        <div className={styles.roomParticipants}>
                                            {room.roomDescription}
                                        </div>
                                    </div>
                                    <button className={styles.joinBtn} onClick={() => router.push(`/think-tank/room/${room.id}`)}>Join</button>
                                </div>
                            )) : (
                                <div className={styles.emptyState}>
                                    <Empty description='No upcoming rooms' />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}

export default DashboardOverview