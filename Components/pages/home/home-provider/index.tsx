// import React from 'react'
import React from "react";
import './style.css'
import emp from "@/public/assets/img/idea-bulb.png"
import connect from "@/public/assets/img/handshake-icon.png"
import fuel from "@/public/assets/img/paint_palette.png"
import styles from './style.module.css'
import { Lightbulb, Users, Palette } from 'lucide-react';
import Card from "./card";
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import AnimatedSection from "@/Components/UIComponents/AnimatedSection";

export const homeProvider = [
  {
    img: emp,
    title: "Empowering Visionaries",
    description: "Where creativity meets collaborations",
  },
  {
    img: connect,
    title: "Connecting With Clients",
    description: "Bridging creativity with opportunity",
  },
  {
    img: fuel,
    title: "Fuel creativity",
    description: "Transform Idea into impactful experience",
  },
];

function HomeProvider() {
  return (
    <section className={styles.features}>
      {/* <div className='a_class'>
        <h1 className='a_1'>Everything you need,</h1>
        <h1 className='a_2'>all in one place</h1>
      </div>
      <div className="home-provider">
        {homeProvider?.map((card, index) => {
          const bgClass = `bg_${(index % 3) + 1}`;
          return <Card key={index} card={card} bgClass={bgClass} />;
        })}
      </div> */}
      <div className={styles.featuresBackground}></div>

      <div className={styles.featuresContainer}>
        <AnimatedSection>
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresTitle}>
              Everything You Need,
              <br />
              <span className={styles.featuresTitleGradient}>All In One Place</span>
            </h2>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureCardOverlay}></div>
              <div className={styles.featureCardContent}>
                <div className={styles.featureIcon}>
                  <Lightbulb />
                </div>
                <h3 className={styles.featureTitle}>Empowering Visionaries</h3>
                <p className={styles.featureDescription}>
                  Transform your ideas into reality with our powerful collaboration tools and resources.
                </p>
              </div>
            </div>

            <div className={`${styles.featureCard} ${styles.cyan}`}>
              <div className={styles.featureCardOverlay}></div>
              <div className={styles.featureCardContent}>
                <div className={styles.featureIcon}>
                  <Users />
                </div>
                <h3 className={styles.featureTitle}>Connecting With Clients</h3>
                <p className={styles.featureDescription}>
                  Build meaningful relationships and expand your professional network seamlessly.
                </p>
              </div>
            </div>

            <div className={`${styles.featureCard} ${styles.teal}`}>
              <div className={styles.featureCardOverlay}></div>
              <div className={styles.featureCardContent}>
                <div className={styles.featureIcon}>
                  <Palette />
                </div>
                <h3 className={styles.featureTitle}>Fuel Creativity</h3>
                <p className={styles.featureDescription}>
                  Unleash your creative potential with innovative tools and collaborative spaces.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

export default HomeProvider;