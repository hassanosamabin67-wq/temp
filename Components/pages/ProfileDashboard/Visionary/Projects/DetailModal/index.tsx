import React, { FC } from 'react'
import { Button, Modal, Tabs } from 'antd'
import styles from './style.module.css'
import ProjectMilestones from '../ProjectMilestone';

interface Milestone {
    id: string;
    orderId: string;
    title: string;
    amount?: number;
    status: 'PENDING' | 'IN PROGRESS' | 'COMPLETED';
    deadline: string;
    createdAt?: string;
}

interface Project {
    id: string;
    title: string;
    status: 'ACTIVE' | 'PENDING' | 'IN REVIEW';
    clientName: string;
    startDate: string;
    deadline: string;
    completedAt?: string;
    description?: string;
    priceType?: string;
}

interface modalInterface {
    visible: boolean;
    onCancel: () => void;
    project: Project;
    milestone?: Milestone[]
}

const DetailModal: FC<modalInterface> = ({ visible, onCancel, project, milestone }) => {
    const projectMilestones = milestone?.filter(m => m.orderId === project.id) || [];
    const isMilestoneBased = project.priceType === 'milestone';

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const tabItems = [
        {
            key: 'overview',
            label: (
                <span className={styles.tabLabel}>Overview</span>
            ),
            children: (
                <div className={styles.tabContent}>
                    <span className={styles.tabHeading}>Project Overview</span>
                    <div className={styles.overviewDetails}>
                        <div className={styles.overviewItem}>
                            <strong>Client:</strong> {project.clientName}
                        </div>
                        <div className={styles.overviewItem}>
                            <strong>Status: </strong>
                            <span className={`${styles.statusBadge} ${styles[`status${project.status.replace(' ', '')}`]}`}>
                                {project.status}
                            </span>
                        </div>
                        <div className={styles.overviewItem}>
                            <strong>Start Date: </strong> {formatDate(project.startDate)}
                        </div>
                        <div className={styles.overviewItem}>
                            <strong>Deadline:</strong> {formatDate(project.deadline)}
                        </div>
                        <div className={styles.overviewItem}>
                            <strong>Description:</strong> {project.description}
                        </div>
                        {project.completedAt && (
                            <div className={styles.overviewItem}>
                                <strong>Completed:</strong> {formatDate(project.completedAt)}
                            </div>
                        )}
                        <div className={styles.overviewItem}>
                            <strong>Project ID:</strong> {project.id}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'Milestone',
            label: (
                <span className={styles.tabLabel}>Milestone</span>
            ),
            children: (
                <div className={styles.tabContent}>
                    <span className={styles.tabHeading}>Project Milestones</span>
                    {isMilestoneBased && projectMilestones.length > 0 ? (
                        projectMilestones.map((ms) => (
                            <ProjectMilestones key={ms.id} deadline={ms.deadline} status={ms.status} title={ms.title} amount={ms.amount} />
                        ))
                    ) : (
                        <p>No milestone for this project</p>
                    )}
                </div>
            )
        },
    ];

    return (
        <Modal
            title={
                <span className={styles.modalTitle}>{project.title}</span>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
            width={600}
        >
            <Tabs
                items={tabItems}
                size="large"
                style={{
                    marginBottom: 0,
                }}
            />
        </Modal>
    )
}

export default DetailModal