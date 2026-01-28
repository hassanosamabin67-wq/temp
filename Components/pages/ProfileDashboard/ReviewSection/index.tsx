import React, { FC, useState } from 'react'
import styles from './style.module.css'
import { Button, Rate } from 'antd';
import ActionButton from '@/Components/UIComponents/ActionBtn';

interface testimonialsProps {
    testimonialData: {
        id: string;
        clientName: string;
        rating: number;
        reviewMessage: string;
        date: string;
    }[];
}

const INITIAL_VISIBLE_COUNT = 4;
const INCREMENT_COUNT = 3;

const ReviewSection: FC<testimonialsProps> = ({ testimonialData }) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
    const visibleData = testimonialData?.slice(0, visibleCount);
    const allShown = visibleData.length >= testimonialData?.length;

    const handleViewMore = () => {
        setVisibleCount((prev) => prev + INCREMENT_COUNT);
    };

    return (
        <div className={styles.section}>
            <div className={styles.reviewsContainer}>
                {visibleData?.map((testimonial) => (
                    <div key={testimonial.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                            <div className={styles.reviewerInfo}>
                                <div className={styles.reviewerAvatar}>{testimonial.clientName.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className={styles.reviewerName}>{testimonial.clientName}</div>
                                    <div className={styles.reviewDate}>2 weeks ago</div>
                                </div>
                            </div>
                            <Rate className={styles.reviewRating} value={testimonial.rating} disabled allowHalf />
                        </div>
                        <p className={styles.reviewText}>{testimonial.reviewMessage}</p>
                    </div>
                ))}
                <ActionButton className={styles.viewAllBtn} onClick={handleViewMore} disabled={allShown}>{allShown ? "No more reviews" : "View more Reviews"}</ActionButton>
            </div>
        </div>
    )
}

export default ReviewSection
