'use client'
import React, { useEffect, useState } from 'react'
import styles from './style.module.css'
import { BsBarChartFill } from "react-icons/bs";
import { PiChartDonutFill } from "react-icons/pi";
import { PiTargetBold } from "react-icons/pi";
import { MdOutlineStreetview } from "react-icons/md";
import useFetchProfileData from '@/hooks/profileDashboard/fetchProfileData';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { Progress } from 'antd';
import StatCard from '@/Components/UIComponents/DashboardOverview/statCard';
import SectionCard from '@/Components/UIComponents/DashboardOverview/Section';
import { ProfileViews } from './ProfileViews';

interface serviceStatsInterface {
    id: string;
    serviceName: string;
    orders: number;
    successRate: string;
}

type Demographic = {
    code: string;
    name: string;
    count: number;
    percent: number;
};

interface statInterface {
    serviceClicks: number;
}

const Analytics = () => {
    const { stats, loading } = useFetchProfileData();
    const profile = useAppSelector((state) => state.auth);
    const [serviceStats, setServiceStats] = useState<serviceStatsInterface[]>([]);
    const [projectConversion, setProjectConversion] = useState<string>("0%");
    const [prCnvLoading, setPrCnvLoading] = useState(false)
    const [demographics, setDemographics] = useState<Demographic[]>([]);
    const [demoLoading, setDemoLoading] = useState(false);
    const [statData, setStatData] = useState<statInterface>({ serviceClicks: 0 })
    const COLORS = [
        "#007bff", // blue
        "#28a745", // green
        "#ffc107", // yellow
        "#17a2b8", // cyan
        "#6c757d", // gray
        "#ff5733", // orange (for "Other")
    ];

    const fetchServiceSuccess = async () => {
        try {
            const { data: services, error: serviceFetchError } = await supabase
                .from("service")
                .select("id, name, bookings_count")
                .eq("profileId", profile.profileId)

            if (serviceFetchError) {
                console.error("Error fetching services", serviceFetchError)
                return
            }

            const serviceIds = (services || []).map(service => service.id)

            const { data: serviceOrders, error: serviceOrderError } = await supabase
                .from("service_orders")
                .select("service_id, status")
                .in("service_id", serviceIds)
                .eq("status", "Approved")

            if (serviceOrderError) {
                console.error("Error fetching service orders", serviceOrderError)
                return
            }

            const approvedCount: Record<string, number> = {};
            (serviceOrders || []).forEach(order => {
                approvedCount[order.service_id] = (approvedCount[order.service_id] || 0) + 1;
            });

            const normalizeStat: serviceStatsInterface[] = services.map(service => {
                const totalOrders = service.bookings_count || 0;
                const approved = approvedCount[service.id] || 0;
                const successRate = totalOrders > 0 ? `${((approved / totalOrders) * 100).toFixed(2)}%` : "0%";

                return {
                    id: service.id,
                    serviceName: service.name,
                    orders: totalOrders,
                    successRate,
                };
            }).filter(service => service.orders > 0)
                .sort((a, b) => b.orders - a.orders);

            setServiceStats(normalizeStat);

        } catch (error) {
            console.error("Unexpected Error:", error)
        }
    }

    const fetchProjectConversion = async () => {
        try {
            setPrCnvLoading(true)
            const { data: services, error: serviceFetchError } = await supabase
                .from("service")
                .select("id")
                .eq("profileId", profile.profileId);

            if (serviceFetchError) {
                console.error("Error fetching services", serviceFetchError);
                return;
            }

            const serviceIds = (services || []).map(s => s.id);
            if (serviceIds.length === 0) {
                setProjectConversion("0%");
                return;
            }

            const { data: orders, error: ordersError } = await supabase
                .from("service_orders")
                .select("id, status, service_id")
                .in("service_id", serviceIds)
                .in("status", ["paid", "Accepted", "Submitted", "Approved", "Rejected"]);

            if (ordersError) {
                console.error("Error fetching service orders", ordersError);
                return;
            }

            const totalRequests = (orders || []).length;
            const converted = (orders || []).filter(o =>
                ["Accepted", "Submitted", "Approved"].includes(o.status)
            ).length;

            const rate = totalRequests > 0 ? `${((converted / totalRequests) * 100).toFixed(2)}%` : "0%";
            setProjectConversion(rate);
        } catch (e) {
            console.error("Unexpected Error (PCR):", e);
        } finally {
            setPrCnvLoading(false)
        }
    };

    const fetchClientDemographics = async () => {
        try {
            setDemoLoading(true);

            const { data: soRows, error: soErr } = await supabase
                .from("service_orders")
                .select("client_country_code, client_country_name, status")
                .eq("visionary_id", profile.profileId);

            if (soErr) {
                console.error("service_orders fetch error", soErr)
                return
            };

            let odRows: any[] | null = null;
            const { data: oRows, error: oErr } = await supabase
                .from("order")
                .select("client_country_code, client_country_name, status")
                .eq("visionary_id", profile.profileId);

            if (oErr) {
                console.warn("order fetch warning (table may not exist):", oErr.message);
                return
            } else {
                odRows = oRows;
            }

            const all = [...((soRows || []) as any[]), ...((odRows || []) as any[])];

            const map: Record<string, { code: string; name: string; count: number }> = {};
            for (const r of all) {
                const code = (r.client_country_code || "XX").toUpperCase();
                const name = r.client_country_name || "Unknown";
                const key = `${code}__${name}`;
                if (!map[key]) map[key] = { code, name, count: 0 };
                map[key].count += 1;
            }

            const entries = Object.values(map);
            if (entries.length === 0) {
                setDemographics([]);
                return;
            }

            entries.sort((a, b) => b.count - a.count);

            const top = entries.slice(0, 5);
            const others = entries.slice(5);
            const total = entries.reduce((sum, e) => sum + e.count, 0);
            const topWithPercents = top.map(e => ({
                ...e,
                percent: Math.round((e.count / total) * 100),
            }));

            const otherCount = others.reduce((s, e) => s + e.count, 0);
            if (otherCount > 0) {
                topWithPercents.push({
                    code: "OTHER",
                    name: "Other",
                    count: otherCount,
                    percent: Math.max(0, 100 - topWithPercents.reduce((s, e) => s + e.percent, 0)),
                });
            } else {
                const sum = topWithPercents.reduce((s, e) => s + e.percent, 0);
                if (sum !== 100 && topWithPercents.length > 0) {
                    topWithPercents[topWithPercents.length - 1].percent += (100 - sum);
                }
            }

            setDemographics(topWithPercents);
        } catch (e) {
            console.error("Unexpected Error (demographics):", e);
            setDemographics([]);
        } finally {
            setDemoLoading(false);
        }
    };

    const fetchStatData = async () => {
        try {
            const { data: serviceClicks, error: scErr } = await supabase
                .from("service")
                .select("clicks")
                .eq("profileId", profile.profileId);

            if (scErr) {
                console.error("service clicks fetch error", scErr);
                return;
            }

            const totalClicks = serviceClicks
                .map(item => item.clicks)
                .filter(clicks => clicks !== null)
                .reduce((sum, clicks) => sum + clicks, 0);

            setStatData({ serviceClicks: totalClicks });
        } catch (error) {
            console.error("Unexpected error while fetching stat data: ", error);
        }
    }

    useEffect(() => {
        fetchServiceSuccess();
        fetchProjectConversion();
        fetchClientDemographics();
        fetchStatData()
    }, [profile.profileId])

    return (
        <div>
            <div className={styles.pageHeader}>
                <span className={styles.pageHeading}>Analytics & Insights</span>
            </div>
            <div className={`${styles.statsOverview} ${styles.sectionWraper}`}>
                {/* <div className={`${styles.statsCard} ${styles.monthlyEarnings}`}>
                    <div className={`${styles.cardIcon} ${styles.impressionIcon}`}><BsBarChartFill /></div>
                    <div className={styles.cardValue}>{stats?.totalStats.impressions}</div>
                    <div className={styles.cardLabel}>Profile Impressions</div>
                </div> */}
                <StatCard
                    icon={<div className={`${styles.cardIcon} ${styles.viewIcon}`}><MdOutlineStreetview /></div>}
                    value={stats?.totalStats.views}
                    label="Profile Views"
                    loading={loading}
                />
                <StatCard
                    icon={<div className={`${styles.cardIcon} ${styles.impressionIcon}`}><BsBarChartFill /></div>}
                    value={projectConversion}
                    label="Project Conversion Rate"
                    loading={prCnvLoading}
                />
                <StatCard
                    icon={<div className={`${styles.cardIcon} ${styles.rateIcon}`}><PiTargetBold /></div>}
                    value={statData?.serviceClicks}
                    label="Service Clicks"
                    loading={loading}
                />
            </div>

            <div className={`${styles.analyticsGrid} ${styles.sectionWraper}`}>
                <ProfileViews profileId={profile?.profileId} monthlyStats={stats?.monthlyStats!} />
                <SectionCard
                    title="Client Demographics"
                    icon="🌍"
                    loading={demoLoading}
                    empty={!demoLoading && demographics.length === 0}
                    emptyDescription="No client geography yet. Once you start getting orders, your audience map will show up here."
                >
                    <ul className={styles.demographicsList}>
                        {demographics.map((d, i) => (
                            <li key={d.code + d.name} className={styles.demographicItem}>
                                <span className={styles.demographicLabel}>{d.name}</span>
                                <Progress
                                    className={styles.demographicBar}
                                    percent={d.percent}
                                    strokeColor={COLORS[i % COLORS.length]}
                                    format={(p) => `${p}%`}
                                />
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            </div>
            {/* <!-- Top Performing Services --> */}
            <div className={styles.sectionWraper}>
                <SectionCard
                    title="Your Top Performing Services"
                    icon="🏆"
                    loading={loading}
                    empty={!serviceStats || serviceStats.length === 0}
                    emptyDescription="Your top services will appear here as you grow your bookings. Keep going 🚀"
                >
                    <div className={styles.servicesGrid}>
                        {serviceStats?.map((service) => (
                            <div
                                key={service.id}
                                className={`${styles.serviceCard} ${serviceStats.length > 3 ? "" : styles.belowTwoCards
                                    }`}
                            >
                                <div className={styles.serviceHeader}>
                                    <div className={styles.serviceTitle}>{service.serviceName}</div>
                                </div>
                                <div className={styles.serviceStats}>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{service.orders}</div>
                                        <div className={styles.statLabel}>Orders</div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{service.successRate}</div>
                                        <div className={styles.statLabel}>Success Rate</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </div >
    )
}

export default Analytics