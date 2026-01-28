import RecommendedVisionaries from '@/Components/pages/client/profile/recommended'
import { Button, Card } from 'antd'
import React from 'react'
import { FaUser } from 'react-icons/fa6'
import styles from './style.module.css'
import { IoClose } from "react-icons/io5";
import { useRouter } from 'next/navigation'
import { RiUserSearchFill } from "react-icons/ri";

const VisionarySuggestion = ({ setSuggestionDismiss }: any) => {
    const router = useRouter();
    return (
        <Card className={styles.cardMain}>
            <span className={styles.closeBtn} onClick={() => setSuggestionDismiss(true)}><IoClose /></span>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}><FaUser />Suggested Visionaries</span>
            </div>
            <RecommendedVisionaries />
            <Button onClick={() => router.push('/visionaries')} icon={<RiUserSearchFill />} className={styles.viewAllBtn}>See All</Button>
        </Card>
    )
}

export default VisionarySuggestion
