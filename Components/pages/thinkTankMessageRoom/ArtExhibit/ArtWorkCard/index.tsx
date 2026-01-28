import React, { FC } from 'react'
import styles from './style.module.css'
import Image from 'next/image'
import { artWorkCard } from '../types'

const ArtWorkCard: FC<artWorkCard> = ({ img, title, description, price, isSold, onClick }) => {
    const truncatedDescription = description?.length > 100 ? description?.slice(0, 100) + '...' : description;
    const imageSrc = img && img.trim() !== '' ? img : '/assets/img/artwork-1.webp';

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.cardImg}>
                <Image
                    className={styles.image}
                    src={imageSrc}
                    width={400}
                    height={400}
                    alt='art_work_card_img'
                    onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/img/artwork-1.webp';
                    }}
                />
                <span className={styles.price}>${price}</span>
                {isSold && <span className={styles.sold}>SOLD</span>}
            </div>
            <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{title}</span>
                <span className={styles.cardDescription}>{truncatedDescription}</span>
            </div>
        </div>
    )
}

export default ArtWorkCard