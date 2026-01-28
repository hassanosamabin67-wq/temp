"use client";

import React from 'react';
import eye from "@/public/assets/img/eye.png";
import dress from "@/public/assets/img/dress.png";
import gaming from "@/public/assets/img/gaming.png";
import movie from "@/public/assets/img/movie.png";
import arts from "@/public/assets/img/arts.png";
import vArts from "@/public/assets/img/Varts.png";
import media from "@/public/assets/img/media.png";
import music from "@/public/assets/img/music.png";
import Store from './store';
import { Calendar, Shirt, Gamepad2, Film, Theater, Paintbrush, TrendingUp, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { setSelectedCategory, setSelectedSubcategories } from '@/store/slices/selectedCategory';
import { UIButton } from '@/Components/custom';
import { menuData } from '@/utils/services';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import AnimatedSection from '@/Components/UIComponents/AnimatedSection';
import styles from './styles.module.css'

const elementor = [
  {
    id: "category-1",
    img: eye,
    icon: Calendar,
    title: "Online Event",
    route: "/services/online-event",
    colorClass: '',
    iconColorClass: '',
    delay: ''
  },
  {
    id: "category-2",
    img: dress,
    delay: 'animation-delay-200',
    icon: Shirt,
    title: "Fashion",
    route: "/services/fashion",
    colorClass: 'yellow',
    iconColorClass: 'yellow',
  },
  {
    id: "category-3",
    img: gaming,
    icon: Gamepad2,
    delay: 'animation-delay-400',
    title: "Gaming eSport",
    route: "/services/gaming-esport",
    colorClass: 'gray',
    iconColorClass: 'gray',
  },
  {
    id: "category-4",
    img: movie,
    icon: Film,
    delay: 'animation-delay-600',
    title: "Entertainment",
    route: "/services/entertainment",
    colorClass: 'pink',
    iconColorClass: 'pink',
  },
  {
    id: "category-5",
    img: arts,
    icon: Theater,
    delay: 'animation-delay-800',
    title: "Performance Arts",
    route: "/services/performance-arts",
    colorClass: 'orange',
    iconColorClass: 'orange',
  },
  {
    id: "category-6",
    img: vArts,
    icon: Paintbrush,
    title: "Visual Arts",
    route: "/services/visual-arts",
    colorClass: '',
    iconColorClass: '',
    delay: ''
  },
  {
    id: "category-7",
    img: media,
    icon: TrendingUp,
    delay: 'animation-delay-200',
    colorClass: 'cyan',
    iconColorClass: 'cyan',
    title: "Creative Marketing & Strategy",
    route: "/services/creative-marketing-and-strategy"
  },
  {
    id: "category-8",
    img: music,
    icon: Music,
    title: "Music",
    delay: 'animation-delay-400',
    colorClass: 'pink',
    iconColorClass: 'pink',
    route: "/services/music",
  },
];

function HomeStore() {
  const dispatch = useAppDispatch()
  const router = useRouter();
  const handleRoute = async (store: any) => {
    dispatch(setSelectedCategory(store.id));
    const category: any = await menuData.find((cat) => cat.id === store.id);
    dispatch(setSelectedSubcategories(store.id));
    dispatch(setSelectedSubcategories(category?.subcategories));
    router.push(store.route);
  }
  return (
    <MaxWidthWrapper className={styles.categories}>
      {/* <div>
        <div className="a_class">
          <h1 className="a_1">Everything you need,</h1>
          <h1 className="a_2">all in one place</h1>
        </div>
        <div className="b-class">
          {elementor?.map((store, index) => (
            <div
              key={index}
              style={{ cursor: "pointer" }}
            >
              <Store className="b_class" store={store} handleRoute={handleRoute} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: "center", margin: "20px 0" }}>
        </div>
      </div> */}
      <div className={styles.categoriesBackground}></div>

      <div className={styles.categoriesContainer}>
        <AnimatedSection>
          <div className={styles.categoriesHeader}>
            <h2 className={styles.categoriesTitle}>
              EVERYTHING YOU NEED,
              <br />
              <span className={styles.categoriesTitleGradient}>ALL IN ONE PLACE</span>
            </h2>
          </div>

          <div className={styles.categoriesGrid}>
            {elementor.slice(0, 4).map((category, index) => (
              <div key={index} onClick={() => handleRoute(category)} className={`${styles.categoryCard} ${category.colorClass}`}>
                <div className={styles.categoryCardOverlay}></div>
                <div className={styles.categoryCardContent}>
                  <div className={`${styles.categoryIcon} ${category.iconColorClass} ${category.delay}`}>
                    <category.icon />
                  </div>
                  <h3 className={styles.categoryTitle}>{category.title}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.categoriesGrid}>
            {elementor.slice(4).map((category, index) => (
              <div key={index} onClick={() => handleRoute(category)} className={`${styles.categoryCard} ${category.colorClass}`}>
                <div className={styles.categoryCardOverlay}></div>
                <div className={styles.categoryCardContent}>
                  <div className={`${styles.categoryIcon} ${category.iconColorClass} ${category.delay}`}>
                    <category.icon />
                  </div>
                  <h3 className={styles.categoryTitle}>{category.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </MaxWidthWrapper>
  );
}

export default HomeStore;
