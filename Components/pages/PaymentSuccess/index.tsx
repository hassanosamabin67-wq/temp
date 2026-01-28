"use client"
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/config/supabase'
import { useAppSelector } from '@/store'
import styles from './style.module.css'
import { Button, Card } from 'antd'
import { FaCheckCircle } from "react-icons/fa";
import dayjs from 'dayjs'

const PaymentSuccess = () => {
    const params = useSearchParams()
    const orderId = params.get("order");
    const profile = useAppSelector((state) => state.auth);
    const [getDataLoading, setDataLoading] = useState(false)
    const [redirectLoading, setRedirectLoading] = useState(false)
    const [serviceOrder, setServiceOrder] = useState<any>(null)
    const router = useRouter();

    const getOrderDetail = async (orderId: string | any) => {
        try {
            setDataLoading(true)
            const { data: serviceOrder, error: checkError } = await supabase
                .from('service_orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (checkError) {
                console.error("Error Fetching Order :", checkError);
                return;
            }
            setServiceOrder(serviceOrder)
        } catch (err) {
            console.error("Unexpected error: ", err)
        } finally {
            setDataLoading(false)
        }
    }

    const redirectDashboard = () => {
        router.push(`/dashboard/${profile.profileType === 'client' ? "client" : "visionary"}/orders`);
        setRedirectLoading(true);
    }

    useEffect(() => {
        if (profile.profileId) {
            getOrderDetail(orderId)
        } else {
            router.push('/')
        }
    }, [profile.profileId]);

    return (
        <div className={styles.container}>
            <Card className={styles.paymentSuccessCard} loading={getDataLoading}>
                <div className={styles.successHeader}>
                    <span className={styles.successIconSpan}><FaCheckCircle className={styles.successIcon} /></span>
                    <span className={styles.successHeading}>Payment Confirmed</span>
                    <p className={styles.successDesc}>Your order has been successfully placed and payment processed</p>
                </div>
                <Card className={styles.paymentDetailCard}>
                    <div className={styles.detailInfo}>
                        <span className={styles.detailKey}>Order Id:</span>
                        <span className={styles.detailValue}>{serviceOrder?.id}</span>
                    </div>
                    <div className={styles.detailInfo}>
                        <span className={styles.detailKey}>Service Ordered:</span>
                        <span className={styles.detailValue}>{serviceOrder?.service_name}</span>
                    </div>
                    <div className={styles.detailInfo}>
                        <span className={styles.detailKey}>Package:</span>
                        <span className={styles.detailValue}>{serviceOrder?.package_name}</span>
                    </div>
                    <div className={styles.detailInfo}>
                        <span className={styles.detailKey}>Total Amount:</span>
                        <span className={styles.detailValue}>${serviceOrder?.amount}</span>
                    </div>
                    <div className={styles.detailInfo}>
                        <span className={styles.detailKey}>Deadline:</span>
                        <span className={styles.detailValue}>{dayjs(serviceOrder?.deadline).format("MMMM D, YYYY")}</span>
                    </div>
                </Card>
                <Button variant='solid' color='geekblue' loading={redirectLoading} className={styles.redirectBtn} onClick={redirectDashboard}>Go to Order Dashboard</Button>
            </Card>
        </div>
    )
}

export default PaymentSuccess