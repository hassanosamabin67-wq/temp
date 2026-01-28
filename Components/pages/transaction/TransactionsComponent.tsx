'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import dayjs from 'dayjs';
import { Spin } from 'antd';

const TransactionsComponent: React.FC<{ limit: boolean }> = ({ limit }) => {
    const [transactions, setTransactions] = useState<any>([]);
    const profile = useAppSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                let query = supabase
                    .from("transactions")
                    .select("*")
                    .or(`client_id.eq.${profile.profileId},user_id.eq.${profile.profileId}`);

                if (limit) {
                    query = query.limit(10);
                }

                const { data, error } = await query;

                if (error || !data) {
                    console.error("Error Fetching Transactions", error);
                    return;
                }

                const orderIds = data.map(t => t.order_id).filter(Boolean);
                const { data: orderData, error: orderError } = await supabase
                    .from("order")
                    .select("*")
                    .in("id", orderIds);

                if (orderError) {
                    console.error("Error Fetching Orders", orderError);
                    return;
                }

                const ordersWithUser = data.map((transactionData) => {
                    const orderDetail = orderData?.find((o) => o.id === transactionData.order_id);
                    return {
                        ...transactionData,
                        order: orderDetail || {},
                    };
                });

                setTransactions(ordersWithUser);
            } catch (err) {
                console.error("Unexpected Error: ", err);
            } finally {
                setLoading(false)
            }
        })();
    }, [profile.profileId]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }} >
                <Spin />
            </div>
        );
    }

    return (
        <>
            {transactions && transactions.length > 0 ? (transactions.map((data: any) => (
                <div key={data.id} className='transactions'>
                    <span>{data?.type || 'No Title'}</span>
                    <span>{dayjs(data.created_at).format("MMM DD YYYY")}</span>
                    <span>${data?.amount.toFixed(2) || '0.00'}</span>
                </div>
            ))) : (
                <div style={{ fontSize: 20, fontWeight: "500" }}>No transaction</div>
            )}
        </>
    );
};

export default TransactionsComponent