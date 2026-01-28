import React, { FC } from 'react'
import styles from './style.module.css'
import { IoCalendarClearOutline } from "react-icons/io5";
import { FaRegClock } from "react-icons/fa6";
import { Avatar, Rate, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FiDollarSign } from "react-icons/fi";
import dayjs from 'dayjs';

type orderStatus = 'Accepted' | "Rejected" | "Pending" | "Completed" | "Approved"

interface UserProfile {
    profileType: 'client' | 'Visionary';
    firstName: string;
    lastName: string;
    userId: string;
}

interface orderDetailProps {
    orderName: string;
    orderDescription: string;
    orderStartDate: string;
    orderEndDate: string;
    orderPrice: number;
    orderStatus: orderStatus;
    orderStatusColor: string;
    orderId: string;
    clientName?: string;
    visionaryName?: string;
    userProfile: UserProfile | null;
    isCompleted?: boolean;
    totalRating?: number;
    completedDate?: string;
}

const OrderDetail: FC<orderDetailProps> = ({
    orderName,
    orderDescription,
    orderStartDate,
    orderEndDate,
    orderPrice,
    orderStatus,
    orderStatusColor,
    orderId,
    clientName,
    visionaryName,
    userProfile,
    isCompleted,
    totalRating,
    completedDate
}) => {
    const getOtherPartyInfo = () => {
        if (userProfile?.profileType === 'client') {
            return {
                name: visionaryName || 'Unknown Visionary',
                role: 'Visionary'
            };
        } else {
            return {
                name: clientName || 'Unknown Client',
                role: 'Client'
            };
        }
    };

    const otherPartyInfo = getOtherPartyInfo();

    return (
        <div className={styles.orderDetailBox}>
            <div className={styles.orderDetailHeader}>
                <div className={styles.orderDetailRight}>
                    <div className={styles.orderDetailInfo}>
                        <span className={styles.orderName}>{orderName}</span>
                        <p className={styles.orderDesc}>{orderDescription}</p>
                    </div>
                    <div className={styles.orderDetailPriceDiv}>
                        <div className={styles.orderPriceDiv}>
                            <FiDollarSign />
                            <span>{orderPrice}</span>
                        </div>
                        <Tag color={orderStatusColor}>{orderStatus}</Tag>
                    </div>
                </div>
                <div className={styles.orderDetailDateDiv}>
                    <div className={styles.orderDateDiv}>
                        <IoCalendarClearOutline />
                        <span className={styles.orderDate}>Assign: {dayjs(orderStartDate).format("MMMM D, YYYY")}</span>
                    </div>
                    <div className={styles.orderDateDiv}>
                        <FaRegClock />
                        <span className={styles.orderDate}>Deadline: {dayjs(orderEndDate).format("MMMM D, YYYY")}</span>
                    </div>
                </div>
                <div className={styles.orderClientDiv}>
                    <Avatar icon={<UserOutlined />} size={35} />
                    <div className={styles.orderClientDetail}>
                        <span className={styles.orderClientName}>{otherPartyInfo.name}</span>
                        <span className={styles.orderClientH2}>{otherPartyInfo.role}</span>
                    </div>
                </div>
                {isCompleted && (
                    <div className={styles.completedOrderDiv}>
                        <span className={styles.completedOrderDate}>Completed on {dayjs(completedDate).format("MMMM D, YYYY")}</span>
                        {totalRating && (
                            <div className={styles.completedOrderRatingDiv}>
                                <Rate
                                    className={styles.completedOrderRate}
                                    value={totalRating}
                                    allowHalf
                                    disabled
                                />
                                <span className={styles.completedOrderRatings}>
                                    ({totalRating}/5)
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className={styles.orderDetailFooter}>
                <span className={styles.orderID}>Order ID: {orderId}</span>
            </div>
        </div>
    )
}

export default OrderDetail
