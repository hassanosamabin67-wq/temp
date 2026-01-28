import { FC, ReactNode } from 'react';
import styles from './style.module.css';
import { Empty, Skeleton } from 'antd';

interface DisplayContainerProps {
    Icon: ReactNode;
    title: string;
    items: ReactNode[];
    emptyDescription?: string;
    loadingState?: boolean;
}

const DisplayContainer: FC<DisplayContainerProps> = ({ Icon, title, items, emptyDescription = 'No items found', loadingState }) => {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                    {Icon}
                    {title}
                </span>
            </div>
            {loadingState ? (
                <Skeleton active />
            ) : (items && items?.length > 0) ? (
                items
            ) : (
                <div className={styles.emptyState}>
                    <Empty description={emptyDescription} />
                </div>
            )}
        </div>
    );
};

export default DisplayContainer;