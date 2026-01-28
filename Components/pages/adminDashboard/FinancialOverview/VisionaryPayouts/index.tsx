import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Alert, Spin } from 'antd';
import dayjs from 'dayjs';
import Stripe from 'stripe';
import { supabase } from '@/config/supabase';

const stripe = new Stripe(process.env.NEXT_PUBLIC_SECRET_KEY!);

const VisionaryPayouts = () => {
    const [loadingData, setLoadingData] = useState(false)
    const [visionaryData, setVisionaryData] = useState<any>([]);

    const handleFetchData = async () => {
        try {
            setLoadingData(true);

            const { data: visionaries, error: fetchError } = await supabase
                .from("users")
                .select("userId, email, userName, firstName, lastName, stripe_account_id")
                .eq("profileType", "Visionary");

            if (fetchError) {
                console.error("Error fetching visionaries", fetchError);
                return;
            }

            const allPayoutData: any[] = [];

            for (const visionary of visionaries) {
                const { userId, email, userName, firstName, lastName, stripe_account_id } = visionary;
                if (!stripe_account_id) continue;
                try {
                    const account = await stripe.accounts.retrieve(stripe_account_id);

                    const isOnboarded =
                        account.details_submitted &&
                        !account.requirements?.disabled_reason &&
                        account.capabilities;

                    const payouts = await stripe.payouts.list({ stripeAccount: stripe_account_id });

                    const combinedData = payouts.data.map((payout) => ({
                        payoutId: payout.id,
                        payoutAmount: payout.amount / 100,
                        applicationFee: payout.application_fee_amount ? payout.application_fee_amount / 100 : 0,
                        date: dayjs.unix(payout.arrival_date).format("MMM D, YYYY"),
                        status: payout.status,
                        stripeAccountId: stripe_account_id,
                        onboardingComplete: isOnboarded ? "Completed" : "Incomplete",
                        visionaryId: userId,
                        email,
                        visionaryName: userName || `${firstName} ${lastName}`
                    }));

                    allPayoutData.push(...combinedData);
                } catch (error) {
                    console.error(`Error fetching payouts for ${stripe_account_id}`, error);
                    continue;
                }
            }

            setVisionaryData(allPayoutData);
        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        handleFetchData();
    }, [])

    const visionaryPayoutsData = visionaryData.map((data: any) => ({
        key: data.payoutId,
        visionaryId: data.visionaryId,
        visionaryName: data.visionaryName,
        email: data.email,
        stripeAccountId: data.stripeAccountId,
        payoutAmount: data.payoutAmount,
        applicationFee: data.applicationFee,
        status: data.status,
        date: data.date,
        onboardingComplete: data.onboardingComplete
    }))

    const visionaryPayoutColumns = [
        {
            title: 'Visionary',
            dataIndex: 'visionaryName',
            key: 'visionaryName',
            render: (name: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>ID: {record.visionaryId}</div>
                </div>
            ),
        },
        {
            title: 'Stripe Account',
            dataIndex: 'stripeAccountId',
            key: 'stripeAccountId',
            render: (accountId: any, record: any) => (
                <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{accountId}</div>
                    <Badge
                        status={record.onboardingComplete === 'Completed' ? 'success' : 'warning'}
                        text={record.onboardingComplete}
                    />
                </div>
            )
        },
        {
            title: 'Payout Amount',
            dataIndex: 'payoutAmount',
            key: 'payoutAmount',
            render: (amount: number) => (
                <div style={{ fontWeight: 'bold', color: amount > 0 ? '#52c41a' : '#999' }}>
                    ${amount.toFixed(2)}
                </div>
            )
        },
        {
            title: 'Application Fee',
            dataIndex: 'applicationFee',
            key: 'applicationFee',
            render: (fee: number) => (
                <div style={{ fontWeight: 'normal', color: '#888' }}>
                    ${fee.toFixed(2)}
                </div>
            )
        },
        {
            title: 'Payout Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const map: Record<string, any> = {
                    paid: { color: 'success', text: 'Paid' },
                    in_transit: { color: 'processing', text: 'In Transit' },
                    failed: { color: 'error', text: 'Failed' },
                    canceled: { color: 'default', text: 'Canceled' }
                };
                const badge = map[status] || { color: 'default', text: status };
                return <Badge status={badge.color} text={badge.text} />;
            }
        },
        {
            title: 'Arrival Date',
            dataIndex: 'date',
            key: 'date'
        }
    ];

    return (
        <Card>
            <Alert
                message="Payout Tracking"
                description="Monitor all payouts to Visionaries and ensure they match connected Stripe account IDs."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
            />
            <Table
                columns={visionaryPayoutColumns}
                dataSource={visionaryPayoutsData}
                loading={loadingData}
                scroll={{ x: 1200 }}
                pagination={{
                    total: visionaryData.length,
                    pageSize: 10,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} visionaries`
                }}
            />
        </Card>
    )
}

export default VisionaryPayouts