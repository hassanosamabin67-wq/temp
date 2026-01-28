import React, { useEffect, useState } from 'react';
import { Card, Tabs, Row, Col, Statistic, Tag, TabsProps } from 'antd';
import { DollarOutlined, WarningOutlined } from '@ant-design/icons';
import StripeTransactions from './StripeTransactions';
import VisionaryPayouts from './VisionaryPayouts';
import { supabase } from '@/config/supabase';
import styles from './style.module.css'

const FinancialOverview = () => {
    const [platformEarnings, setPlatformEarnings] = useState({
        total: 0,
        services: 0,
        rooms: 0,
        contracts: 0,
    });

    const handleFetchTransactions = async () => {
        try {
            const { data: transactions, error: fetchTransactionError } = await supabase
                .from("transactions")
                .select("*");

            if (fetchTransactionError) {
                console.error("Error Fetching transactions: ", fetchTransactionError);
                return;
            }

            const clientIds = [...new Set(transactions.map((d) => d.client_id))]
            const visionaryIds = [...new Set(transactions.map((d) => d.user_id))]
            const userIds = [...new Set([...clientIds, ...visionaryIds])];

            const { data: userData, error: fetchUserDataError } = await supabase
                .from("users")
                .select("userId,firstName,lastName,userName,stripe_account_id,email,status,earning")
                .in("userId", userIds)

            if (fetchUserDataError) {
                console.error("Error Fetching user data: ", fetchUserDataError);
                return;
            }

            const userMap = new Map();
            userData.forEach((user) => {
                userMap.set(user.userId, user)
            })

            const totalPlatformEarning = transactions.reduce(
                (sum, e) => sum + (Number(e.application_fee || 0) + Number(e.amount || 0)),
                0
            );

            const totalRoomRevenue = transactions
                .filter((e) => e.category === "Collab Room")
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const totalApplicationFee = transactions.reduce(
                (sum, e) => sum + Number(e.application_fee || 0),
                0
            );

            const enrichedData = transactions.map((t) => ({
                ...t,
                clientData: userMap.get(t.client_id),
                visionaryData: userMap.get(t.user_id),
            }));

            setPlatformEarnings({
                total: totalPlatformEarning,
                services: 0,
                rooms: totalRoomRevenue,
                contracts: totalApplicationFee
            });
            return enrichedData;
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    useEffect(() => {
        handleFetchTransactions();
    }, [])

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Stripe Transactions',
            children: <StripeTransactions onFetchData={handleFetchTransactions} />
        },
        {
            key: '2',
            label: 'Visionary Payouts',
            children: <VisionaryPayouts />
        }

    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
                    Financial Overview
                </h1>
            </div>

            {/* Summary Stats */}
            <div className={styles.statsGrid}>
                <Card>
                    <Statistic
                        title="Total Platform Earnings"
                        value={platformEarnings.total}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Services Revenue"
                        value={platformEarnings.services}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Rooms Revenue"
                        value={platformEarnings.rooms}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Application Fees"
                        value={platformEarnings.total * 0.1}
                        precision={2}
                        valueStyle={{ color: '#722ed1' }}
                    />
                </Card>
            </div>

            <Tabs
                items={items}
                indicator={{ size: (origin) => origin - 0, align: "center" }}
            />
        </div>
    );
};

export default FinancialOverview;