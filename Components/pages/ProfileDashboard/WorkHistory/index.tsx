'use client'
import { Button, Empty, Rate } from 'antd';
import dayjs from 'dayjs';
import React, { FC, useState } from 'react';
import styles from './style.module.css';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const INITIAL_VISIBLE_COUNT = 4;
const INCREMENT_COUNT = 3;

interface workHistoryProps {
    workHistoryData: {
        id: string;
        title: string;
        review: number;
        review_message: string;
        start_datetime: string;
        end_datetime: string;
    }[];
}

const WorkHistory: FC<workHistoryProps> = ({ workHistoryData }) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

    const handleViewMore = () => {
        setVisibleCount((prev) => prev + INCREMENT_COUNT);
    };

    const visibleData = workHistoryData.slice(0, visibleCount);
    const allShown = visibleData.length >= workHistoryData.length;

    return (
        <div>
            {visibleData.map((data) => (
                <div key={data.id} className={styles.workHistoryCard}>
                    <span className={styles.workHistoryTitle}>{data.title}</span>
                    <div className={styles.workHistoryInfoDiv}>
                        {data?.review && (
                            <div>
                                <Rate allowHalf disabled value={data.review} />
                            </div>
                        )}
                        {data.start_datetime && (
                            <div>
                                <span>
                                    {dayjs(data.start_datetime).format("MMMM D, YYYY")} - {dayjs(data.end_datetime).format("MMMM D, YYYY")}
                                </span>
                            </div>
                        )}
                    </div>
                    {data.review_message && (
                        <div>
                            <p>{data.review_message}</p>
                        </div>
                    )}
                </div>
            ))}
            <ActionButton onClick={handleViewMore} disabled={allShown}>
                {allShown ? 'No More Work History' : 'View More'}
            </ActionButton>
        </div>
    );
};

export default WorkHistory;