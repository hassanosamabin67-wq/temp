'use client'
import { useEffect, useState } from 'react';
import styles from './style.module.css';
import { StatChart } from './StatChart';
import { getStatsOverviewData } from '@/utils/chartData';
import SectionCard from '@/Components/UIComponents/DashboardOverview/Section';

export function ProfileViews({ profileId, monthlyStats }: {
    profileId?: string;
    monthlyStats: {
        views: number;
        impressions: number;
        clicks: number;
    };
}) {
    const [data, setData] = useState<{ views: any[]; clicks: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        async function run() {
            if (!profileId) return;
            setLoading(true);
            const res = await getStatsOverviewData(profileId);
            if (alive) {
                setData(res);
                setLoading(false);
            }
        }
        run();
        return () => { alive = false; };
    }, [profileId]);

    return (
        <SectionCard className={styles.chartWrp} title={`Your profile had ${monthlyStats?.clicks || 0} clicks this month`} icon='📈' loading={loading || !data}>
            <div className={styles.chartContainer}>
                <StatChart data={data!} />
                <div className={styles.statGrid}>
                    <div className={styles.statBlock}>
                        <span className={styles.dtText}>
                            {data?.views?.reduce((acc, { y }) => acc + y, 0).toLocaleString() || 0}
                        </span>
                        <span className={styles.ddText}>Total Views</span>
                    </div>

                    <div className={styles.statBlock}>
                        <span className={styles.dtText}>
                            {data?.clicks?.reduce((acc, { y }) => acc + y, 0).toLocaleString() || 0}
                        </span>
                        <span className={styles.ddText}>Total Clicks</span>
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}