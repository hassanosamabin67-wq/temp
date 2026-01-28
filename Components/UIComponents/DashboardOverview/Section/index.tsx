import React from "react";
import { Skeleton, Empty } from "antd";
import styles from "./style.module.css";

interface SectionCardProps {
    title: string;
    icon?: React.ReactNode;
    loading?: boolean;
    children?: React.ReactNode;
    empty?: boolean;
    emptyDescription?: string;
    className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    loading = false,
    children,
    empty = false,
    emptyDescription,
    className
}) => {
    return (
        <div className={`${styles.section} ${className}`}>
            <span className={styles.sectionTitle}>
                {icon && <span>{icon}</span>}
                {title}
            </span>

            {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
            ) : empty ? (
                <Empty description={emptyDescription || "No data available"} />
            ) : (
                children
            )}
        </div>
    );
};

export default SectionCard;