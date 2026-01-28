'use client'
import React, { useEffect, useState } from 'react'
import "./ProfileStats.css"
import CollapseComponent from './Collapse'
import useProfileStup from '../profileContent/ts';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useSearchParams } from 'next/navigation';
import TaskManager from './TaskManager';
import { Button, TabsProps, Tabs, Modal } from 'antd';
import { TfiStatsUp } from "react-icons/tfi";
import statsImg from '@/public/assets/img/graphImg.jpg'
import Image from 'next/image';
import { supabase } from '@/config/supabase';

const ProfileStats = () => {
    const { profile } = useProfileStup();
    const authState = useSelector((state: RootState) => state.auth);
    const [orderData, setOrderData] = useState<any>([]);
    const searchParams = useSearchParams();
    const visionary = searchParams.get('visionary');
    const dashboardOwner = profile.profileId !== visionary
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ordersByStatus, setOrdersByStatus] = useState<any>({
        pending: [],
        accepted: [],
        approved: [],
        rejected: []
    });

    const [stats, setStats] = useState<{ views: number, impressions: number, clicks: number }>({
        views: 0,
        impressions: 0,
        clicks: 0
    });

    const showModal = () => setIsModalOpen(true)
    const handleOk = () => setIsModalOpen(false)
    const handleCancel = () => setIsModalOpen(false)

    const handleFetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("order")
                .select("*")
                .eq("visionary_id", authState.profileId);

            if (error) {
                console.error("Error fetching order: ", error);
                return;
            }

            if (data) {
                const grouped = {
                    pending: data.filter(o => o.status === "Pending"),
                    accepted: data.filter(o => o.status === "Accepted"),
                    approved: data.filter(o => o.status === "Approved"),
                    rejected: data.filter(o => o.status === "Rejected"),
                };
                setOrdersByStatus(grouped);
            }

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from("profile_stats")
                .select("views, impressions, clicks")
                .eq("user_id", profile.profileId)

            if (error) {
                console.error("Error fetching stats:", error);
                return;
            }

            if (data && data.length > 0) {
                const totals = data.reduce(
                    (acc, row) => ({
                        views: acc.views + (row.views || 0),
                        impressions: acc.impressions + (row.impressions || 0),
                        clicks: acc.clicks + (row.clicks || 0)
                    }),
                    { views: 0, impressions: 0, clicks: 0 }
                );
                setStats(totals);
            } else {
                setStats({ views: 0, impressions: 0, clicks: 0 });
            }
        } catch (err) {
            console.error("Unexpected Error:", err);
        }
    };

    useEffect(() => {
        if (visionary) return;
        handleFetchOrders()
        fetchStats()
    }, [])

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Profile Views',
            children: (
                <div>
                    <span>Total Views {stats.views}</span>
                </div>
            ),
        },
        {
            key: '2',
            label: 'Impressions and clicks',
            children: (
                <div>
                    <span>{stats.impressions} Impressions and {stats.clicks} clicks</span>
                </div>
            ),
        },
        {
            key: '3',
            label: 'Conversion Rate from Visitors',
            children: (
                <div>
                    <span>
                        {stats.impressions > 0
                            ? `${((stats.clicks / stats.impressions) * 100).toFixed(2)}% Conversion Rate`
                            : "0% Conversion Rate"}
                    </span>
                </div>
            ),
        }
    ];

    return (
        dashboardOwner ? (
            <>
                <div className='container stats-container'>

                    <Modal footer={() => null} title="Profile Stats" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                        <Tabs centered defaultActiveKey="1" items={items} />
                    </Modal>

                    <div>
                        <h2>Orders</h2>
                        <CollapseComponent ordersByStatus={ordersByStatus} />
                    </div>

                    <div>
                        <div className='profile-stats'>
                            <div>
                                <Image width={200} height={200} src={statsImg} alt='profile stats' />
                            </div>
                            <div>
                                <Button className='stats-button' onClick={showModal} icon={<TfiStatsUp />}>View Profile Stats</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <TaskManager /> */}
            </>
        ) : (null)
    )
}

export default ProfileStats