'use client'
import React, { useState } from 'react'
import styles from './style.module.css'
import ProjectCard from './ProjectCard';
import { Tabs, Spin, Alert } from 'antd';
import useVisionaryProjects from '@/hooks/profileDashboard/visionary/useVisionaryProjects';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';

const ProjectDashboard = () => {
    const [activeTab, setActiveTab] = useState('active');
    const {
        projects,
        completedProjects,
        loading,
        projectCounts,
        getProjectsByStatus,
        milestones
    } = useVisionaryProjects();

    if (loading) {
        return (
            <div className={styles.projectCardMain}>
                <div className={styles.pageHeader}>
                    <span className={styles.pageHeading}>Projects</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    const tabItems = [
        {
            key: 'active',
            label: (
                <span className={styles.tabLabel}>
                    Active {projectCounts?.active > 0 ? projectCounts?.active : ''}
                </span>
            ),
            children: (
                <ProjectCard
                    projects={getProjectsByStatus('ACTIVE')}
                    emptyMessage="No active projects found"
                    milestone={milestones}
                />
            )
        },
        {
            key: 'pending',
            label: (
                <span className={styles.tabLabel}>
                    Pending {projectCounts?.pending > 0 ? projectCounts?.pending : ''}
                </span>
            ),
            children: (
                <ProjectCard
                    projects={getProjectsByStatus('PENDING')}
                    emptyMessage="No pending projects found"
                    milestone={milestones}
                />
            )
        },
        {
            key: 'inreview',
            label: (
                <span className={styles.tabLabel}>
                    In Review {getProjectsByStatus('IN REVIEW').length > 0 ? getProjectsByStatus('IN REVIEW').length : ''}
                </span>
            ),
            children: (
                <ProjectCard
                    projects={getProjectsByStatus('IN REVIEW')}
                    emptyMessage="No projects in review"
                    milestone={milestones}
                />
            )
        },
        {
            key: 'completed',
            label: (
                <span className={styles.tabLabel}>
                    Completed {projectCounts.completed > 0 ? projectCounts.completed : ''}
                </span>
            ),
            children: (
                <ProjectCard
                    projects={getProjectsByStatus('COMPLETED')}
                    emptyMessage="No completed projects found"
                    milestone={milestones}
                />
            )
        }
    ];

    return (
        <MaxWidthWrapper withPadding={false} className={styles.projectCardMain}>
            <div className={styles.pageHeader}>
                <span className={styles.pageHeading}>
                    Projects
                </span>
            </div>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
                style={{
                    marginBottom: 0,
                }}
            />
        </MaxWidthWrapper>
    )
}

export default ProjectDashboard