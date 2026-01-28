import React, { FC } from 'react'
import styles from './style.module.css'
import { Progress } from 'antd'
import { BiStats } from "react-icons/bi";

interface profileStatsProps {
    completion: number;
    Views: number;
    Impressions: number;
    Clicks: number;
}

const ProfileStats: FC<profileStatsProps> = ({ completion, Views, Impressions, Clicks }) => {
    return (
        <div className={styles.statsMain}>
            <div className={styles.progressDiv}>
                <Progress
                    strokeLinecap="round"
                    strokeColor="#6C63FF"
                    trailColor="#e0e0e0"
                    type="dashboard"
                    percent={completion}
                    className={styles.customProgress}
                    format={(percent) => ` ${percent}%`}
                />
                <span className={styles.progressText}>Profile Completion</span>
            </div>
            <div className={styles.statsDiv}>
                <div className={styles.statsHeader}>
                    <span className={styles.statsH1}>Statstics</span>
                    <span className={styles.statsIcon}><BiStats /></span>
                </div>
                <div className={styles.statsContainer}>
                    <div className={styles.statsBox}>
                        <div className={styles.statsInfo}>
                            <span className={styles.statsHeading}>Profile Views</span>
                            <span className={styles.statsValue}>{Views}</span>
                        </div>
                        {/* <span>icomm</span> */}
                    </div>
                    <div className={styles.statsBox}>
                        <div className={styles.statsInfo}>
                            <span className={styles.statsHeading}>Impressions and clicks</span>
                            <span className={styles.statsValue}>{Impressions} Impressions and {Clicks} clicks</span>
                        </div>
                        {/* <span>icomm</span> */}
                    </div>
                    <div className={styles.statsBox}>
                        <div className={styles.statsInfo}>
                            <span className={styles.statsHeading}>Conversion Rate from Visitors</span>
                            <span className={styles.statsValue}>{Impressions > 0
                                ? `${((Clicks / Impressions) * 100).toFixed(2)}%`
                                : "0%"}</span>
                        </div>
                        {/* <span>icomm</span> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileStats
