import React, { FC } from 'react'
import Image from 'next/image'
import styles from './style.module.css'
import cardImg from '@/public/assets/img/gaming-esports-img.webp'
import { Skeleton } from 'antd';

interface PortfolioData {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    thumbnails: string[];
}

interface portfolioProps {
    portfolio: PortfolioData;
    loadingState: boolean;
    onClick?: () => void;
}

const PortfolioCard: FC<portfolioProps> = ({ portfolio, loadingState, onClick }) => {
    const cardImage = portfolio.thumbnails?.[0] || cardImg;
    const previewLimit = 200;
    const fullDescription = portfolio.description || "No description provided.";
    const isTruncated = fullDescription.length > previewLimit;
    const displayText = isTruncated
        ? fullDescription.slice(0, previewLimit) + '...'
        : fullDescription;

    if (loadingState) {
        return (
            <div className={styles.portfolioCard}>
                <Skeleton active />
            </div>
        )
    }

    return (
        <div 
            className={styles.portfolioCard} 
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={styles.cardImgDiv}>
                <Image className={styles.cardImg} src={cardImage} alt='card-img' width={200} height={200} />
            </div>
            <span className={styles.cardTitle}>{portfolio.title}</span>
            <p className={styles.cardDesc}>{displayText}</p>
        </div>
    )
}

export default PortfolioCard
