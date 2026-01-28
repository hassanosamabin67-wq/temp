import React, { FC } from 'react'
import { Avatar, Rate } from 'antd'
import styles from './style.module.css'

interface reviewProps {
    clientName: string;
    reviewMessage: string;
    rating: number;
}

const ClientReviews: FC<reviewProps> = ({ clientName, reviewMessage, rating }) => {
    return (
        <div className={styles.reviewCard}>
            <div className={styles.reviewContent}>
                <div className={styles.clientInfo}>
                    <Avatar size={45}>{clientName.charAt(0).toUpperCase()}</Avatar>
                    <span className={styles.clientName}>{clientName}</span>
                </div>
                <div className={styles.reviewDetail}>
                    <Rate value={rating} disabled allowHalf />
                    <p className={styles.reviewMessage}>{reviewMessage}</p>
                </div>
            </div>
        </div>
    )
}

export default ClientReviews
