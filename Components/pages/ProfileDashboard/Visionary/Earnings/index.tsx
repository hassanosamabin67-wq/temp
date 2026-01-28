'use client'
import React, { useEffect, useState } from 'react'
import styles from './style.module.css'
import { BsCreditCardFill } from "react-icons/bs";
import { Card, Table, Tag } from 'antd';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';
import { useAppSelector } from '@/store';
import StatCard from '@/Components/UIComponents/DashboardOverview/statCard';

interface earningSummaryInterface {
    totalEarning: number;
    monthTotal: number;
    pendingPayout: number;
}

const Earning = () => {
    const [earningSummary, setEarningSummary] = useState<earningSummaryInterface>({
        totalEarning: 0,
        monthTotal: 0,
        pendingPayout: 0,
    });
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const profileRedux = useAppSelector((state) => state.auth);
    const [dataLoading, setDataLoading] = useState(false);

    const mapStatus = (status: string): 'PAID' | 'PENDING' | 'IN REVIEW' => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
                return 'PAID';
            case 'submitted':
                return 'IN REVIEW';
            case 'pending':
            default:
                return 'PENDING';
        }
    };

    const getEarningsSummaryAndHistory = async (profileId: string) => {
        try {
            setDataLoading(true);

            const { data: serviceOrders, error: soErr } = await supabase
                .from('service_orders')
                .select('id, service_name, amount, tip_price, status, created_at, client_id, users!service_orders_client_id_fkey(userId, firstName, lastName)')
                .eq('visionary_id', profileId);

            if (soErr) throw soErr;

            const { data: projectOrders, error: oErr } = await supabase
                .from('order')
                .select('id, price, tip_price, status, created_at, client_id, title, users!order_client_id_fkey(userId, firstName, lastName)')
                .eq('visionary_id', profileId);

            if (oErr) throw oErr;

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

            const COMPLETED = new Set(['approved', 'completed']);
            const PENDING = new Set(['submitted']);

            const now = dayjs();
            const startOfThisMonth = now.startOf('month');
            const endOfThisMonth = now.endOf('month');

            const inRange = (d: string, start: dayjs.Dayjs, end: dayjs.Dayjs) =>
                dayjs(d).isAfter(start.subtract(1, 'millisecond')) && dayjs(d).isBefore(end.add(1, 'millisecond'));

            const completed = all.filter(e => COMPLETED.has(e.status));

            const totalEarning = completed.reduce((sum, e) => sum + e.value, 0);
            const monthTotal = completed
                .filter(e => inRange(e.created_at, startOfThisMonth, endOfThisMonth))
                .reduce((sum, e) => sum + e.value, 0);
            const pendingPayout = all
                .filter(e => PENDING.has(e.status))
                .reduce((sum, e) => sum + e.value, 0);

            setEarningSummary({
                totalEarning: Math.round(totalEarning),
                monthTotal: Math.round(monthTotal),
                pendingPayout: Math.round(pendingPayout),
            });

            const historyData = [
                ...(serviceOrders || []).map((order: any, index: number) => ({
                    key: `so_${order.id}`,
                    date: dayjs(order.created_at).format('MMM DD, YYYY'),
                    projectName: `${order.service_name} (Service Order)`,
                    clientName: `${order.users.firstName} ${order.users.lastName}` || "Client",
                    status: mapStatus(order.status),
                    amount: (Number(order.amount) || 0) + (Number(order.tip_price) || 0),
                    paymentMethod: "Stripe Payment"
                })),
                ...(projectOrders || []).map((order: any, index: number) => ({
                    key: `po_${order.id}`,
                    date: dayjs(order.created_at).format('MMM DD, YYYY'),
                    projectName: order.title || "Project Order",
                    clientName: `${order.users.firstName} ${order.users.lastName}` || "Client",
                    status: mapStatus(order.status),
                    amount: (Number(order.price) || 0) + (Number(order.tip_price) || 0),
                    paymentMethod: "Stripe Payment"
                }))
            ].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

            setPaymentHistory(historyData);

        } catch (err) {
            console.error('Error computing earnings summary:', err);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (profileRedux.profileId) {
            getEarningsSummaryAndHistory(profileRedux.profileId);
        }
    }, [profileRedux.profileId]);

    const tableColumns = [
        {
            title: (<span className={styles.tableLabel}>Date</span>),
            dataIndex: 'date',
            key: 'date',
            width: 150,
            render: (date: string) => (
                <span>{date}</span>
            ),
        },
        {
            title: (<span className={styles.tableLabel}>Project Name</span>),
            dataIndex: 'projectName',
            key: 'projectName',
            width: 200,
            render: (projectName: string) => (
                <span style={{ fontWeight: 500 }}>{projectName}</span>
            ),
        },
        {
            title: (<span className={styles.tableLabel}>Client Name</span>),
            key: 'clientName',
            dataIndex: "clientName",
            width: 150,
            render: (clientName: string) => (
                <div style={{ display: 'flex', gap: '4px' }}>
                    <span>Client: </span>
                    <span style={{ fontWeight: 500, color: "#4c4c4c" }}>{clientName}</span>
                </div>
            )
        },
        {
            title: (<span className={styles.tableLabel}>Amount</span>),
            key: 'amount',
            dataIndex: 'amount',
            width: 150,
            render: (amount: number) => (
                <div style={{ fontWeight: 600, marginBottom: '2px', color: "#28a745" }}>
                    +${amount.toLocaleString()}
                </div>
            ),
        },
        {
            title: (<span className={styles.tableLabel}>Status</span>),
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => {
                const color = status === 'PAID' ? 'green' : status === 'IN REVIEW' ? 'geekblue' : 'gold';
                return (
                    <Tag
                        color={color}
                        style={{
                            borderRadius: '12px',
                            padding: '2px 12px',
                            fontWeight: 500
                        }}
                    >
                        {status}
                    </Tag>
                );
            },
        },
    ];

    return (
        <div>
            <div className={styles.pageHeader}>
                <span className={styles.pageHeading}>Earnings & Payments</span>
                <span className={styles.subHeader}>Your craft. Your payout. Always secure.</span>
            </div>
            <div className={styles.earningsOverview}>
                <StatCard
                    icon="💰"
                    title="Total Lifetime Earnings"
                    value={`$${earningSummary.totalEarning.toLocaleString()}`}
                    label="Since joining Kaboom Collab"
                    subtitle="All-time earnings, including completed and pending payouts."
                    variant="totalEarnings"
                    loading={dataLoading}
                />
                <StatCard
                    icon="📊"
                    title="This Month"
                    value={`$${earningSummary.monthTotal.toLocaleString()}`}
                    label="From confirmed projects this month"
                    subtitle="Updated in real time."
                    variant="monthlyEarnings"
                    loading={dataLoading}
                />
                <StatCard
                    icon="⏳"
                    title="Pending Payout"
                    value={`$${earningSummary.pendingPayout.toLocaleString()}`}
                    label="Awaiting release"
                    subtitle="Funds will be available after client approval."
                    variant="pendingPayout"
                    loading={dataLoading}
                />
            </div>

            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: "30px 15px" }}>
                        <span style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>
                            <BsCreditCardFill style={{ marginRight: '8px', color: '#693400' }} />
                            <span style={{ fontWeight: 600, color: '#333' }} >Payment History</span>
                        </span>
                    </div>
                }
                style={{ marginBottom: '32px', boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            >
                <Table
                    columns={tableColumns}
                    dataSource={paymentHistory}
                    loading={dataLoading}
                    pagination={{
                        total: paymentHistory.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} payments`,
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
            </Card>

            {/* <!-- Payment Methods Section --> */}
            {/* <div className={styles.paymentMethodsSection}>
                <span className={styles.paymentMethodsTitle}>Payment Methods</span>
                <p className={styles.stripeFeature}>Stripe Issuing: Instant access to your funds once projects are approved.</p>

                <div className={styles.methodCards}>
                    <div className={`${styles.methodCard} ${styles.stripeCard}`}>
                        <div className={styles.methodCardTitle}>
                            <div className={`${styles.methodIcon} ${styles.stripeIcon}`}>S</div>
                            Stripe Issuing
                            <span className={styles.instantBadge}>(Instant)</span>
                        </div>
                        <div className={styles.methodCardDescription}>
                            Get instant access to your earnings the moment your project is approved. No waiting, no delays - your money is available immediately.
                        </div>
                    </div>

                    <div className={styles.methodCard}>
                        <div className={styles.methodCardTitle}>
                            <div className={`${styles.methodIcon} ${styles.bankIcon}`}>B</div>
                            Bank Transfer
                            <span className={styles.instantBadge}>(Standard)</span>
                        </div>
                        <div className={styles.methodCardDescription}>
                            Direct to your bank in 2–3 business days.
                        </div>
                    </div>
                </div>
            </div> */}

            <div className={styles.notesSection}>
                <h3 className={styles.notesTitle}>Why Choose Kaboom Collab?</h3>
                <div className={styles.noteItem}>
                    Kaboom Collab pays visionaries instantly once projects are approved. No waiting weeks.
                </div>
                <div className={styles.noteItem}>
                    Choose your payout method below — instant with Stripe Issuing or standard bank transfer.
                </div>
            </div>

        </div>
    )
}

export default Earning
