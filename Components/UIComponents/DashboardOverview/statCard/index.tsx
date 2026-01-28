import React from "react";
import { Skeleton } from "antd";
import styles from './style.module.css'

interface StatCardProps {
    icon?: React.ReactNode;
    title?: string;
    value?: string | number | React.ReactNode;
    label: string;
    subtitle?: string;
    variant?: "totalEarnings" | "monthlyEarnings" | "pendingPayout" | "default";
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    title,
    value,
    label,
    subtitle,
    variant = "default",
    loading = false,
}) => {
    return (
        <div className={`${styles.card} ${styles[variant]}`}>
            <div className={styles.cardIcon}>{icon}</div>
            {title && <div className={styles.cardTitle}>{title}</div>}
            <div className={styles.cardValue}>
                {loading ? <Skeleton.Input active size="large" /> : value}
            </div>
            <div className={styles.cardLabel}>
                {loading ? <Skeleton.Input active size="small" /> : label}
            </div>
            {subtitle && (
                <div className={styles.cardSubtitle}>
                    {loading ? <Skeleton.Input active size="small" /> : subtitle}
                </div>
            )}
        </div>
    );
};

export default StatCard;