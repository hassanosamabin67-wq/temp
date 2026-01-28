import { FC } from 'react';
import styles from './style.module.css';
import dayjs from 'dayjs';

interface milestoneInterface {
    title: string;
    amount?: number;
    status: 'PENDING' | 'IN PROGRESS' | 'COMPLETED';
    deadline: string;
}

const ProjectMilestones: FC<milestoneInterface> = ({ title, deadline, status, amount }) => {
    const getStatusBGClass = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return styles.milestoneItemCompleted;
            case 'IN PROGRESS':
                return styles.milestoneItemInProgress;
            case 'PENDING':
                return styles.milestoneItemPending;
            default:
                return styles.milestoneItemPending;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return styles.milestoneStatusCompleted;
            case 'IN PROGRESS':
                return styles.milestoneStatusInProgress;
            case 'PENDING':
                return styles.milestoneStatusPending;
            default:
                return styles.milestoneStatusPending;
        }
    };

    return (
        <div className={styles.milestoneContent}>
            <div className={`${styles.milestoneItem} ${getStatusBGClass(status)}`}>
                <div className={styles.milestoneFlex}>
                    <div>
                        <div className={styles.milestoneName}>{title}</div>
                        <div className={styles.milestoneDate}>Deadline: {dayjs(deadline).format("MMM DD, YYYY")}</div>
                        <span className={styles.milestoneAmount}>Amount: {amount}</span>
                    </div>
                    <div className={`${styles.milestoneStatus} ${getStatusClass(status)}`}>{status}</div>
                </div>
            </div>
        </div>
    );
};

export default ProjectMilestones;