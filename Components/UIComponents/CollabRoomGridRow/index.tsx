import { FC, ReactNode } from 'react'
import styles from './style.module.css'

interface CollabRoomGridRowProps {
    children: ReactNode;
    className?: string;  // Make className optional
}

const CollabRoomGridRow: FC<CollabRoomGridRowProps> = ({ children, className }) => {
    return <div className={`${styles.layout} ${className || ''}`}>{children}</div>
}

export default CollabRoomGridRow