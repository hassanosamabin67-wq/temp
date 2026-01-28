import React from 'react';
import './style.css';
import achiever from '@/public/assets/img/fetureSectionBanner.jpeg';
import licon from '@../../../public/assets/img/icon.svg';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import AnimatedSection from '@/Components/UIComponents/AnimatedSection';
import styles from './styles.module.css'
import Image from 'next/image';

function HomeAchiever() {
    const features = [
        'Connect with diverse talents across the globe',
        'Foster meaningful collaborations that inspire',
        'Access innovative tools and resources',
        'Expand your artistic reach with our vast network',
        'Unlock a culture that celebrates creative freedom'
    ];
    return (
        <MaxWidthWrapper>
            {/* <div className='home-section-cont'>
                <div className='child_A'>
                    <div className='child_A1'>Unleashing Creativity</div>
                    <div className='child_A2'>Elevate Your Creative Potential With <span style={{ color: "#0891b2" }}>Kaboom Collab</span></div>
                    <div className='child_A3'>Kaboom Collab is the nexus where visionary artistry and innovative collaboration converge. Our platform empowers creatives to transcend boundaries, fostering a space where inspiration and strategy collide to birth extraordinary outcomes. With us, your creative potential knows no limits.</div>
                    <div className='child_A4'>
                        <ul >
                            <li>

                                connect with diverse talents across the globe.
                            </li>
                            <li>

                                faster meaniingful collaborations that inspire.
                            </li>
                            <li>

                                Navigate creative challenges with expert insights.
                            </li>
                            <li>

                                expand your artistic reach with our vast network.
                            </li>
                            <li>

                                thrives in a culture that celebrates creative freedom.
                            </li>
                        </ul>
                    </div>
                </div>
                <div className='child_B'>
                    <Image src={achiever.src} alt='ahiever' width={500} height={500} />
                </div>
            </div> */}
            <section className={styles.about}>
                <div className={styles.aboutBlobs}>
                    <div className={styles.aboutBlob1}></div>
                    <div className={styles.aboutBlob2}></div>
                </div>

                <div className={styles.aboutContainer}>
                    <AnimatedSection>
                        <div className={styles.aboutGrid}>
                            <div className={styles.aboutContent}>
                                <span className={styles.aboutBadge}>Unleashing Creativity</span>
                                <h2 className={styles.aboutTitle}>
                                    Elevate Your Creative Potential With
                                    <span className={styles.aboutTitleGradient}> Kaboom Collab</span>
                                </h2>
                                <p className={styles.aboutDescription}>
                                    Kaboom Collab is the space where visionary artistry and innovative collaboration converge.
                                    Our platform empowers creatives to transcend boundaries, fostering a space where imagination
                                    and strategy collide to birth extraordinary outcomes.
                                </p>

                                <div className={styles.aboutFeatures}>
                                    {features.map((feature, index) => (
                                        <div key={index} className={styles.aboutFeature}>
                                            <div className={styles.aboutFeatureIcon}>
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className={styles.aboutFeatureText}>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.aboutImageWrapper}>
                                <div className={styles.aboutImageGlow}></div>
                                <div className={styles.aboutImageContainer}>
                                    <Image
                                        width={300}
                                        height={300}
                                        src={achiever}
                                        alt="Collaboration"
                                        className={styles.aboutImage}
                                    />
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>
        </MaxWidthWrapper>
    )
}

export default HomeAchiever