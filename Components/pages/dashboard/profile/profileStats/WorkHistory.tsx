'use client'
import { supabase } from '@/config/supabase';
import { RootState, useAppSelector } from '@/store';
import { PlusSquareOutlined, StarFilled, StarOutlined } from '@ant-design/icons'
import { Empty, Rate, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react'
import ContentCard, { ExperienceForm } from '../profileContent/ContentCard';
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "@/store/slices/auth-slice";
import { useSearchParams } from "next/navigation";

const WorkHistory = ({ visionary }: any) => {
    const [workHisoryData, setWorkHistoryData] = useState<any>([]);
    const [loadingData, setLoadingData] = useState(false)
    const profile = useAppSelector((state) => state.auth);
    const [visible, setVisible] = useState(false);
    const dispatch = useDispatch()
    const authState = useSelector((state: RootState) => state.auth);
    const searchParams = useSearchParams();

    const handleFetchWorkHistory = async () => {
        try {
            setLoadingData(true)
            const { data, error } = await supabase
                .from('order')
                .select("*")
                .eq("visionary_id", visionary || profile.profileId)
                .eq("status", "Approved")
            if (error) {
                console.error("Error Fetching work history: ", error)
                return
            }
            setWorkHistoryData(data)

        } catch (error) {
            console.error("Unexpected Error: ", error)
        } finally {
            setLoadingData(false)
        }
    }

    // const onCreate = async (values: any, categoryKey: any) => {
    //     console.log("Received values of form: ", values);
    //     setVisible(false);

    //     const updatedAuthState = {
    //         ...authState,
    //         [categoryKey]: [...(authState[categoryKey] || []), values],
    //     };

    //     try {
    //         const { data, error } = await supabase
    //             .from("users")
    //             .update({ [categoryKey]: updatedAuthState[categoryKey] }) // Updating only the relevant field
    //             .eq("profileId", authState.profileId)
    //             .select();

    //         if (error) {
    //             console.error("Error updating Supabase:", error);
    //         } else {
    //             console.log("Updated data:", data);
    //             dispatch(setAuthData(updatedAuthState));
    //         }
    //     } catch (err) {
    //         console.error("Unexpected error:", err);
    //     }
    // };


    useEffect(() => {
        handleFetchWorkHistory()
    }, [])

    if (loadingData) {
        return (
            <Spin />
        )
    }

    return (
        <div className='container'>
            <ExperienceForm visible={visible} onCancel={() => setVisible(false)} />
            <h2>Work History</h2>
            <div style={{ display: "grid", gridTemplateColumns: "49% 49%", gap: 25 }}>
                <div>
                    {workHisoryData.length > 0 ? (
                        workHisoryData.map((data: any) => (
                            <div key={data.id} style={{ border: '1px solid #e3e3e3', padding: 30, borderRadius: 8, margin: "15px 0" }}>
                                <span style={{ fontSize: 20, fontWeight: 500 }}>{data.title}</span>
                                <div style={{ display: "flex", gap: 10, alignItems: " center", margin: ' 6px 0 12px 0' }}>
                                    {data?.review && (<div><Rate allowHalf disabled defaultValue={data.review} /></div>)}
                                    {data.start_datetime && (
                                        <div>
                                            <span>{dayjs(data.start_datetime).format("MMMM D, YYYY")}-{dayjs(data.end_datetime).format("MMMM D, YYYY")}</span>
                                        </div>
                                    )}
                                </div>
                                {data.review_message && (<div>
                                    <p>{data.review_message}</p>
                                </div>)}
                            </div>
                        ))
                    ) : (
                        <Empty description="No Work History" />
                    )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                        <ContentCard cardTitle="Experience" details={profile?.experience} categoryKey={'experience'} />
                    </div>
                    <div>
                        <ContentCard
                            cardTitle="Certifications"
                            details={profile?.certifications}
                            categoryKey={'certifications'}
                        />
                    </div>
                </div>
                {/* <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <h2>Experience</h2>
                        <div>
                            {!visionary && <PlusSquareOutlined onClick={() => setVisible(true)} />}
                            <div style={{ marginBottom: 20 }}>
                                <span>Full stack developer</span>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor dicta optio maxime, dolores illo nam officia corrupti cupiditate odit, quaerat quasi, at modi asperiores ducimus repudiandae ab! Dignissimos, vitae ipsam.</p>
                                <p>15 Feb, 2023 - 10 March, 2023</p>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <span>Full stack developer</span>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor dicta optio maxime, dolores illo nam officia corrupti cupiditate odit, quaerat quasi, at modi asperiores ducimus repudiandae ab! Dignissimos, vitae ipsam.</p>
                                <p>15 Feb, 2023 - 10 March, 2023</p>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <span>Full stack developer</span>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor dicta optio maxime, dolores illo nam officia corrupti cupiditate odit, quaerat quasi, at modi asperiores ducimus repudiandae ab! Dignissimos, vitae ipsam.</p>
                                <p>15 Feb, 2023 - 10 March, 2023</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2>Certifications</h2>
                        <div>
                            <div style={{ marginBottom: 20 }}>
                                <span>Full stack developer</span>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor dicta optio maxime, dolores illo nam officia corrupti cupiditate odit, quaerat quasi, at modi asperiores ducimus repudiandae ab! Dignissimos, vitae ipsam.</p>
                                <p>15 Feb, 2023 - 10 March, 2023</p>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <span>Full stack developer</span>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor dicta optio maxime, dolores illo nam officia corrupti cupiditate odit, quaerat quasi, at modi asperiores ducimus repudiandae ab! Dignissimos, vitae ipsam.</p>
                                <p>15 Feb, 2023 - 10 March, 2023</p>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <span>Full stack developer</span>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor dicta optio maxime, dolores illo nam officia corrupti cupiditate odit, quaerat quasi, at modi asperiores ducimus repudiandae ab! Dignissimos, vitae ipsam.</p>
                                <p>15 Feb, 2023 - 10 March, 2023</p>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    )
}

export default WorkHistory