import React, { useState } from 'react'
import styles from './style.module.css'
import { Button, Empty } from 'antd'
import { IoFolderOpen } from "react-icons/io5";
import { BsChatLeftText } from "react-icons/bs";
import DetailModal from '../DetailModal';
import ActionButton from '@/Components/UIComponents/ActionBtn';

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

interface ProjectCardProps {
    projects: Project[];
    emptyMessage?: string;
    milestone?: Milestone[];
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    projects,
    emptyMessage = "No projects found",
    milestone
}) => {
    const [openModal, setOpenModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return `${styles.statusBadge} ${styles.statusActive}`;
            case 'PENDING':
                return `${styles.statusBadge} ${styles.statusPending}`;
            case 'IN REVIEW':
                return `${styles.statusBadge} ${styles.statusReview}`;
            default:
                return `${styles.statusBadge} ${styles.statusCompleted}`;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const handleViewDetails = (project: Project) => {
        setSelectedProject(project);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedProject(null);
    };

    if (projects.length === 0) {
        return (
            <div className={styles.projectsGrid}>
                <Empty
                    description={emptyMessage}
                    style={{
                        padding: '2rem',
                        color: '#666'
                    }}
                />
            </div>
        );
    }

    return (
        <div className={styles.projectsGrid}>
            {projects.map((project) => (
                <div key={project.id} className={styles.projectCard}>
                    <div className={styles.projectHeader}>
                        <div>
                            <div className={styles.projectTitle}>{project.title}</div>
                            <div className={styles.projectClient}>Client: {project.clientName}</div>
                        </div>
                        <span className={getStatusBadgeClass(project.status)}>
                            {project.status.replace('_', ' ')}
                        </span>
                    </div>

                    <span className={styles.cardSubHeading}>Timeline</span>

                    <div className={styles.details}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailKey}>Start Date</span>
                            <span className={styles.detailValue}>{formatDate(project.startDate)}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailKey}>Deadline</span>
                            <span className={styles.detailValue}>{formatDate(project.deadline)}</span>
                        </div>
                        {project.completedAt && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailKey}>Completed</span>
                                <span className={styles.detailValue}>{formatDate(project.completedAt)}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.projectActions}>
                        <ActionButton
                            icon={<IoFolderOpen />}
                            className={`${styles.btn}`}
                            onClick={() => handleViewDetails(project)}
                        >
                            View Details
                        </ActionButton>
                        {/* <Button
                            icon={<BsChatLeftText />}
                            className={`${styles.btn} ${styles.btnOutline}`}
                        >
                            Chat
                        </Button> */}
                    </div>
                </div>
            ))}

            {selectedProject && (
                <DetailModal
                    visible={openModal}
                    onCancel={handleCloseModal}
                    project={selectedProject}
                    milestone={milestone}
                />
            )}
        </div>
    )
}

export default ProjectCard