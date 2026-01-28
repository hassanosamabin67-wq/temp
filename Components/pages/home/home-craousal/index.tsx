import CustomCarousel from '@/Components/custom/custom-craousal';
import React from 'react';
import styles from './HomeCrousal.module.css'; // Adjust the path as needed
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const HomeCrousal: React.FC = () => {
  // const slides = [
  //   "/assets/img/homebanners/home-banner1.jpeg",
  //   "/assets/img/homebanners/home-banner2.jpeg",
  //   "/assets/img/homebanners/home-banner3.jpeg",
  //   "/assets/img/homebanners/home-banner4.jpeg",
  // ];

  // const carouselContent = slides.map((src, index) => (
  //   <div
  //     key={index}
  //     className={styles.carouselSlide}
  //     style={{ backgroundImage: `url(${src})` }}
  //   >
  //     <div className={styles.bgOverlay}></div>
  //     <Image src={src} alt={`Slide ${index + 1}`} width={500} height={500} className={styles.foregroundImage} />
  //   </div>
  // ));
  const carouselContent = [
    <div className={styles.carouselSlide} style={{ backgroundImage: 'url("/assets/img/homeCarouselTwo.jpg")' }}>
      <h3 className={styles.carouselHeading}>
        "Turn Your Vision Into Reality – Unlock the Power of Innovation and Creative Freedom."
      </h3>
    </div>,

    <div className={styles.carouselSlide} style={{ backgroundImage: 'url("/assets/img/homeCarouselTwo.jpg")' }}>
      <h3 className={styles.carouselHeading}>
        "Empowering Visionaries – Build Your Brand, Showcase Your Skills, and Grow Your Network."
      </h3>
    </div>,

    <div className={styles.carouselSlide} style={{ backgroundImage: 'url("/assets/img/homeCarouselThree.jpg")' }}>
      <h3 className={styles.carouselHeading}>
        "Custom Solutions for Visionaries – Simplify Your Workflow with Intuitive Designs."
      </h3>
    </div>,

    <div className={styles.carouselSlide} style={{ backgroundImage: 'url("/assets/img/carouselOne.jpg")' }}>
      <h3 className={styles.carouselHeading}>
        "Visionaries Like a Pro – Explore New Opportunities, Collaborate, and Thrive."
      </h3>
    </div>,
  ];

  return (
    // <div className={styles.carouselContainer}>
    //   <CustomCarousel
    //     content={carouselContent}
    //     autoplay={true}
    //     dotPosition="bottom"
    //     effect="scrollx"
    //   />
    // </div>
    <section className={styles.hero}>
      <div className={styles.heroBackground}></div>

      <div className={styles.heroBlobs}>
        <div className={styles.heroBlob1}></div>
        <div className={styles.heroBlob2}></div>
        <div className={styles.heroBlob3}></div>
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Empowering Visionaries to Build,
            <span className={styles.heroTitleGradient}> Showcase</span>, and
            <span className={styles.heroTitleAccent}> Grow</span>
          </h1>
          <p className={styles.heroDescription}>
            The ultimate platform for creative collaboration. Build your brand, showcase your skills,
            and grow your network in one powerful space.
          </p>
          <div className={styles.heroButtons}>
            <Link href={'/visionaries'} className={styles.heroCtaPrimary}>
              Explore Visionaries
              <ArrowRight className={styles.heroCtaIcon} />
            </Link>
            <Link href={'/signup'} className={styles.heroCtaSecondary}>
              Join as a Member
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.heroFade}></div>
    </section >
  );
};

export default HomeCrousal;
