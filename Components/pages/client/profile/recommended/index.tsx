'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import userImg from '@/public/assets/img/userImg.webp'
import { supabase } from '@/config/supabase'
import { useRouter } from 'next/navigation'
import { Button, Tag, Tooltip } from 'antd'
import styles from './style.module.css'
import { BASE_URL } from '@/utils/constants/navigations'
import { HeartFilled, HeartOutlined } from '@ant-design/icons'
import { BiMessageDetail } from "react-icons/bi";
import { FaUser } from "react-icons/fa6";
import { useAppSelector } from '@/store'
import { useMyNetwork } from '@/hooks/useMyNetwork'

const RecommendedVisionaries = () => {
    const [recommendedVisionaries, setRecommendedVisionaries] = useState<any>([]);
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth);
    const [loadingMessageId, setLoadingMessageId] = useState<string | null>('');
    const { addVisionaryLoading, toggleFavorite, favoriteVisionaries } = useMyNetwork(profile.profileId!)

    const getVisionaries = async () => {
        try {
            const { data: visionaries, error } = await supabase
                .from("users")
                .select('*')
                .eq('profileType', 'Visionary')
                .limit(10)

            if (error) {
                console.error("Error fetching visionary ", error);
                return;
            }

            const shuffled = visionaries.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 6);
            setRecommendedVisionaries(selected);

        } catch (err) {
            console.error("Unexpected Error: ", err);
            return;
        }
    }

    const handleMessageVisionary = async (profileId: string, participantId: string) => {
        try {
            setLoadingMessageId(participantId)
            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let conversationId;

            if (existingConversation) {
                conversationId = existingConversation.id
            }

            if (!existingConversation) {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                conversationId = newConversation.id;
            }

            router.push(`/messages/room/${conversationId}?ch=${participantId}`)

        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoadingMessageId(null)
        }
    }

    useEffect(() => {
        getVisionaries()
    }, [])

    return (
        <div className={styles.recommendContainer}>
            {recommendedVisionaries && recommendedVisionaries.map((visionary: any) => {
                const fullName = `${visionary?.firstName || ''} ${visionary?.lastName || ''}`.trim();
                const maxLength = 20;
                const truncatedFullName = fullName.length > maxLength ? fullName.slice(0, maxLength) + '...' : fullName;
                const truncatedTitle = visionary?.title?.length > 30 ? visionary?.title.slice(0, 30) + '...' : fullName;
                const displayedSkills = visionary.skills ? visionary.skills.slice(0, 4) : [];
                const moreSkillsCount = (visionary.skills?.length || 0) - 4;
                const isFavorite = favoriteVisionaries.includes(visionary.userId);

                return (
                    <div key={visionary.profileId} className={styles.recommendDiv}>
                        <div className={styles.visionaryDetail}>
                            <Image className={styles.recommendImg} src={visionary.profileImage || userImg} alt='user-image' width={100} height={100} />
                            <div>
                                <span className={styles.recommendName}>{truncatedFullName}</span>
                                {/* <span>{visionary.userName || "@user"}</span> */}
                                <span className={styles.profileTitle}>{truncatedTitle || "@user"}</span>
                            </div>
                        </div>
                        <div className={styles.skillsTagDiv}>
                            {displayedSkills.map((skill: string, index: number) => (
                                <Tag key={index} className={styles.skillTag}>{skill}</Tag>
                            ))}

                            {moreSkillsCount > 0 && (
                                <Tag className={styles.skillTag}>+{moreSkillsCount} more</Tag>
                            )}
                        </div>
                        <div className={styles.btnDiv}>
                            <Button variant='outlined' color='blue' onClick={() => router.push(`/${BASE_URL}?visionary=${visionary.profileId}`)} icon={<FaUser />}>View Profile</Button>
                            <Tooltip title="Message">
                                <Button icon={<BiMessageDetail />} variant='outlined' color='green' onClick={() => handleMessageVisionary(profile.profileId!, visionary?.userId)} loading={loadingMessageId === visionary?.userId} />
                            </Tooltip>
                            <Tooltip title={isFavorite ? "Remove from my network" : "Add to my network"}>
                                <Button icon={isFavorite ? <HeartFilled /> : <HeartOutlined />} variant='outlined' color='pink' onClick={() => toggleFavorite(visionary)} loading={addVisionaryLoading === visionary?.userId} />
                            </Tooltip>
                        </div>
                    </div>
                )
            })}
        </div >
    )
}

export default RecommendedVisionaries