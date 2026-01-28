import { FC } from 'react'
import styles from './style.module.css'

interface headerInterface {
    title: string;
    subTitle?: string;
}

const HeaderUI: FC<headerInterface> = ({ title, subTitle }) => {
    return (
        <div className={styles.header}>
            <div className={styles.headerContent}>
                <span className={styles.headerTitle}>{title}</span>
                {subTitle && (<span className={styles.headerSubTiTle}>{subTitle}</span>)}
            </div>
        </div>
    )
}

export default HeaderUI