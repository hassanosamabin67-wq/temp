// components/VisionariesSection.tsx

import React from 'react';
import styles from './style.module.css';
import Image from 'next/image'; // Next.js Image component for optimized images
import card1 from '@/public/assets/img/meet-visionaries-card1.png'
import card2 from '@/public/assets/img/meet-visionaries-card2.png'
import card3 from '@/public/assets/img/meet-visionaries-card4.png'

// Define the shape for our visionary data
interface Visionary {
    id: number;
    name: string; // Not displayed, but good for alt text or internal use
    imageSrc: string; // Path to the silhouette image
}

// Mock data for our visionaries
const visionaries: Visionary[] = [
    { id: 1, name: 'Visionary One', imageSrc: card1.src }, // You'll need to create these images
    { id: 2, name: 'Visionary Two', imageSrc: card2.src },
    { id: 3, name: 'Visionary Three', imageSrc: card3.src },
];

const VisionariesSection: React.FC = () => {
    return (
        <section className={styles.visionariesContainer}>
            {/* The main title/tagline for the section */}

            {/* Grid for the visionary cards */}
            <div className={styles.cardsGrid}>
                {visionaries.map((visionary) => (
                    <div key={visionary.id} className={styles.card}>
                        {/* The silhouette image */}
                        <div className={styles.imageWrapper}>
                            {/* Using Next.js Image component for performance */}
                            <Image
                                src={visionary.imageSrc}
                                alt={`Silhouette of ${visionary.name}`}
                                layout="fill" // Allows the image to fill the parent div
                                objectFit="contain" // Ensures the image is contained within its bounds
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default VisionariesSection;