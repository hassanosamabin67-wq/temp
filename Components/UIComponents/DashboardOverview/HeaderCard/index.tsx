import { FC } from 'react';
import styles from './style.module.css'

interface cardInterface {
    cardValue: string;
    cardLabel: string;
    isPrice?: boolean;
}

const HeaderCard: FC<cardInterface> = ({ cardLabel, cardValue, isPrice }) => {
    return (
        <div className={styles.statCard}>
            <div className={`${styles.statValue} ${isPrice ? styles.price : ""}`}>{cardValue}</div>
            <div className={styles.statLabel}>{cardLabel}</div>
        </div>
    )
}

export default HeaderCard