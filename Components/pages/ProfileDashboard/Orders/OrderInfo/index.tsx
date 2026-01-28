'use client'
import { Button, Card, Modal } from 'antd'
import React, { useState } from 'react'
import styles from './style.module.css'
import OrderDetail from './OrderDetail'
import { FaCircleNotch, FaCheck } from "react-icons/fa";
import { MdOutlineTimer } from "react-icons/md";
import { MdOutlineNotInterested } from "react-icons/md";
import { HiMiniTrophy } from "react-icons/hi2";

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
}

type OrderStatusType = {
    active: OrderDataInterface[];
    completed: OrderDataInterface[];
    pending: OrderDataInterface[];
    rejected: OrderDataInterface[];
};

interface OrderInfoProps {
    ordersByStatus: OrderStatusType;
    userProfile: any | null;
}

const OrderInfo: React.FC<OrderInfoProps> = ({ ordersByStatus, userProfile }) => {
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedDetail, setSelectedDetail] = useState<any>(null)

    const getStatusTagColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'gold';
            case 'Accepted': return "geekblue";
            case 'Approved': return 'green';
            case 'Rejected': return "red";
            default: return "geekblue";
        }
    };

    const getStatusTagText = (status: string) => {
        switch (status) {
            case 'Pending': return 'Pending';
            case 'Accepted': return "Accepted";
            case 'Approved': return 'Completed';
            case 'Rejected': return "Rejected";
            default: return "Accepted";
        }
    };

    const renderOrderList = (orders: OrderDataInterface[]) => {
        if (orders.length === 0) {
            return <div>No orders found.</div>;
        }

        return orders.map((order, index) => (
            <OrderDetail
                key={`${order.orderId}-${index}`}
                orderName={order.orderName}
                orderDescription={order.orderDescription}
                orderStartDate={order.startData}
                orderEndDate={order.deadline}
                orderPrice={order.amount}
                orderStatus={getStatusTagText(order.status)}
                orderStatusColor={getStatusTagColor(order.status)}
                orderId={order.orderId}
                clientName={order.clientName}
                visionaryName={order.visionaryName}
                userProfile={userProfile}
                isCompleted={order.status === 'Approved'}
                totalRating={order.rating}
                completedDate={order.status === 'Approved' ? order.deadline : undefined}
            />
        ));
    };

    const detailItems = [
        {
            key: '1',
            label: 'Active Projects',
            children: renderOrderList(ordersByStatus.active),
        },
        {
            key: '2',
            label: 'Completed Projects',
            children: renderOrderList(ordersByStatus.completed),
        },
        {
            key: '3',
            label: 'Pending Projects',
            children: renderOrderList(ordersByStatus.pending),
        },
        {
            key: '4',
            label: 'Rejected Projects',
            children: renderOrderList(ordersByStatus.rejected),
        },
    ];

    const orderCardData = [
        {
            key: "1",
            icon: (<FaCircleNotch />),
            cardTitle: `${ordersByStatus.active.length} Active Projects`,
            cardDesc: "In progress with " + (userProfile?.profileType === 'client' ? 'visionaries' : 'clients'),
            status: 'active'
        },
        {
            key: "2",
            icon: (<HiMiniTrophy />),
            cardTitle: `${ordersByStatus.completed.length} Completed Projects`,
            cardDesc: "Successfully delivered",
            status: 'completed'
        },
        {
            key: "3",
            icon: (<MdOutlineTimer />),
            cardTitle: `${ordersByStatus.pending.length} Pending projects`,
            cardDesc: userProfile?.profileType === 'client'
                ? "Awaiting visionary approval"
                : "Awaiting client approval or pending delivery",
            status: 'pending'
        },
        {
            key: "4",
            icon: (<MdOutlineNotInterested />),
            cardTitle: `${ordersByStatus.rejected.length} Rejected Projects`,
            cardDesc: "Declined or canceled",
            status: 'rejected'
        },
    ]

    const handleView = (detailKey: string) => {
        const detail = detailItems.find(item => item.key === detailKey)
        setSelectedDetail(detail)
        setShowDetailModal(true)
    }

    return (
        <>
            <div className={styles.orderInfoContainer}>
                <div className={styles.orderInfoHeader}>
                    <span className={styles.orderInfoH1}>Orders</span>
                    <p className={styles.orderInfoDesc}>
                        Manage and track all your project orders
                        {userProfile?.profileType === 'client' ? ' with visionaries' : ' from clients'}
                    </p>
                </div>
                <div className={styles.orderCardGrid}>
                    {orderCardData.map((cardData) => (
                        <Card key={cardData.key} className={styles.orderCard}>
                            <div className={styles.orderCardBody}>
                                <div className={styles.orderCardInfo}>
                                    <span className={`${styles.orderCardIcon} ${styles[cardData.status + 'Icon']}`}>{cardData.icon}</span>
                                    <div className={styles.orderCardDetail}>
                                        <span className={styles.orderCardTitle}>{cardData.cardTitle}</span>
                                        <p className={styles.orderCardValue}>{cardData.cardDesc}</p>
                                    </div>
                                </div>
                                <Button className={styles.viewDetailBtn} onClick={() => handleView(cardData.key)}>View</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <Modal
                title={<span className={styles.modalTitle}>{selectedDetail?.label}</span>}
                open={showDetailModal}
                onCancel={() => setShowDetailModal(false)}
                footer={null}
                width={1000}
                className={styles.detailModal}
                centered
            >
                <div className={styles.modalDiv}>
                    {selectedDetail?.children}
                </div>
            </Modal>
        </>
    )
}

export default OrderInfo
