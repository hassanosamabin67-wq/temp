// components/Card.tsx
import React from "react";
import styles from "./stye.module.css";

interface CardProps {
  image: string;
  name: string;
  description: string;
  rating: string;
  price: string;
  level?: string;
  videoConsultation?: boolean;
}

const ServiceCard: React.FC<CardProps> = ({
  image,
  name,
  description,
  rating,
  price,
  level,
  videoConsultation,
}) => {
  return (
    <div className={styles.card}>
      <img src={image} alt={name} className={styles.image} />
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.rating}>
          <span>⭐ {rating}</span>
        </div>
        <p className={styles.price}>From {price}</p>
        {videoConsultation && <p className={styles.video}>🎥 Offers video consultations</p>}
        {level && <p className={styles.level}>{level}</p>}
      </div>
    </div>
  );
};

export default ServiceCard;
