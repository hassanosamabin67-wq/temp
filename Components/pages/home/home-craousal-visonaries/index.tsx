import CustomCarousel from '@/Components/custom/custom-craousal';
import React from 'react';
import guy1 from "@/public/assets/img/guy1.png";
import lad1 from "@/public/assets/img/lad1.png";
import lad2 from "@/public/assets/img/lad2.png";
import { Button } from 'antd';
import Image from 'next/image';
import styles from './HomeCrousalVison.module.css'; // Adjust the path if needed
import Link from 'next/link';
import img from '@/public/assets/img/meet-visionaries.png'
import VisionariesSection from './VisionariesSection';
import { Users } from 'lucide-react';
import './style.css'
import AnimatedSection from '@/Components/UIComponents/AnimatedSection';

const HomeCrousalVison: React.FC = () => {
  // const carouselContent = [
  //   <div className={styles.carouselSlide}>
  //     <Image src={guy1.src} alt="Visionary Guy 1" className={styles.carouselImage} />
  //     <Image src={lad2.src} alt="Visionary Lady 2" className={styles.carouselImage} />
  //     <Image src={lad1.src} alt="Visionary Lady 1" className={styles.carouselImage} />
  //   </div>,
  //   <div className={styles.carouselSlide}>
  //     <Image src={lad2.src} alt="Visionary Lady 2" className={styles.carouselImage} />
  //     <Image src={lad1.src} alt="Visionary Lady 1" className={styles.carouselImage} />
  //     <Image src={guy1.src} alt="Visionary Guy 1" className={styles.carouselImage} />
  //   </div>,
  //   <div className={styles.carouselSlide}>
  //     <Image src={guy1.src} alt="Visionary Guy 1" className={styles.carouselImage} />
  //     <Image src={lad2.src} alt="Visionary Lady 2" className={styles.carouselImage} />
  //     <Image src={lad1.src} alt="Visionary Lady 1" className={styles.carouselImage} />
  //   </div>,
  // ];

  return (
    // <div className={styles.carouselContainer}>
    //   <div className={styles.carouselHeader}>
    //     <h1 className={styles.carouselTitle}>Meet Our <span className={styles.visionaryTitle}>Visionaries</span></h1>
    //     <p className={styles.carouselDescription}>
    //       Discover the creative forces behind <strong>Kaboom Collab</strong>. Our visionaries are innovators, strategists,
    //       and artists dedicated to transforming ideas into reality. Explore the stories of collaboration, ingenuity,
    //       and passion that shape every masterpiece we create.
    //     </p>
    //   </div>
    //   {/* <CustomCarousel
    //     content={carouselContent}
    //     autoplay={false}
    //     dotPosition="bottom"
    //     effect="scrollx"
    //   /> */}
    //   {/* <div className={styles.vsImagesContainer}>
    //     <div className={styles.vsImagesDiv}>
    //       <Image src={img} alt='visionaries' width={500} height={500} className={styles.vsImages} />
    //     </div>
    //   </div> */}
    //   <VisionariesSection />
    //   <div className={styles.exploreBtnDiv}>
    //     <Link href={'/visionaries'} className={styles.exploreBtn}>Explore Visionaries</Link>
    //   </div>
    // </div>
    <section className="visionaries">
      <div className="visionaries-background"></div>

      <div className="visionaries-container">
        <AnimatedSection>
          <div className="visionaries-header">
            <h2 className="visionaries-title">
              Meet Our <span className="visionaries-title-gradient">Visionaries</span>
            </h2>
            <p className="visionaries-description">
              Discover the creative forces behind Kaboom Collab. Our innovators are passionate,
              strategic, and dedicated to transforming ideas into extraordinary outcomes.
            </p>
          </div>

          <div className="visionaries-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="visionary-card">
                <div className="visionary-card-overlay"></div>
                <div className="visionary-card-glow">
                  <div className="visionary-card-glow-blob"></div>
                </div>
                <div className="visionary-card-content">
                  <div className="visionary-avatar">
                    <Users />
                  </div>
                  <h3 className="visionary-name">Creative Visionary</h3>
                  <p className="visionary-role">Expert in Innovation & Strategy</p>
                </div>
              </div>
            ))}
          </div>

          <div className="visionaries-cta">
            <Link href={'/visionaries'} className="visionaries-button">Explore Visionaries</Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default HomeCrousalVison;
