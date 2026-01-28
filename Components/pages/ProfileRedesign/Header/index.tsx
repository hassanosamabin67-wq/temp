'use client'
import React, { useState } from 'react'
import { useAppSelector } from '@/store';
import { Button, Image, Rate } from 'antd'
import { GoDotFill, GoDot } from "react-icons/go";
import { FiPhone } from "react-icons/fi";
import { MdOutlineMailOutline } from "react-icons/md";
import { IoLocationOutline } from "react-icons/io5";
import styles from './style.module.css'
import { MdEdit } from "react-icons/md";

const ProfileHeader = () => {
    const profile = useAppSelector((state) => state.auth);
    const [expanded, setExpanded] = useState(false);

    const fullDescription = profile.overview || "Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam deleniti incidunt minus quidem debitis velit nemo quod doloribus...";
    const previewLimit = 200;

    const isTruncated = fullDescription.length > previewLimit;
    const displayText = expanded ? fullDescription : fullDescription.slice(0, previewLimit);

    return (
        <div className={styles.headerMain}>
            <div className={styles.profileDetail}>
                <div className={styles.imgSection}>
                    <Image className={styles.profileImg} src={profile.profileImage} height={100} width={100} />
                    <span className={styles.icon}><GoDotFill className={styles.offlineDot} /></span>
                </div>
                <div className={styles.infoSection}>
                    <div className={styles.nameSection}>
                        <span className={styles.profileName}>{profile.firstName} {profile.lastName}</span>
                        <span className={styles.userName}>{profile.userName}</span>
                    </div>
                    <span className={styles.profileTagLine}>{profile.title}</span>
                    <div className={styles.descriptionDiv}>
                        <p className={styles.profileDescription}>
                            {displayText}
                            {!expanded && isTruncated && (
                                <span className={styles.readMoreBtn} onClick={() => setExpanded(true)}> ... Read More </span>
                            )}
                        </p>
                    </div>
                    <div className={styles.profileContactInfo}>
                        <div className={styles.contactInfoDiv}>
                            <span className={styles.icon}><IoLocationOutline /></span>
                            <span className={styles.contactInfoValue}>Pakistan</span>
                        </div>
                        <div className={styles.contactInfoDiv}>
                            <span className={styles.icon}><FiPhone /></span>
                            <span className={styles.contactInfoValue}>03212-349-232</span>
                        </div>
                        <div className={styles.contactInfoDiv}>
                            <span className={styles.icon}><MdOutlineMailOutline /></span>
                            <span className={styles.contactInfoValue}>demouser@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.secondSectionDiv}>
                <div>
                    <div className={styles.secondSection}>
                        <span className={styles.secondSectionKey}>Total Earnings:</span>
                        <span className={`${styles.secondSectionValue} ${styles.totalEarningPrice}`}>$0.00</span>
                    </div>
                    <div className={styles.secondSection}>
                        <span className={styles.secondSectionKey}>Member since:</span>
                        <span className={styles.secondSectionValue}>12 March 2025</span>
                    </div>
                    <div className={styles.ratingDiv}>
                        <div className={styles.ratingDetail}>
                            <span className={styles.ratingValue}>4.6</span>
                            <span className={styles.overallText}>Overall Rating</span>
                        </div>
                        <Rate disabled defaultValue={4.6} allowHalf />
                    </div>
                </div>
                <Button>Let's Collab</Button>
                <div className={styles.editInfo}>
                    <span className={styles.icon}><MdEdit className={styles.editBtn} /></span>
                    <span>Edit Info</span>
                </div>
            </div>
        </div>
    )
}

export default ProfileHeader
