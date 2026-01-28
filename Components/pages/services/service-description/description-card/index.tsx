import React from "react";
import Image, { StaticImageData } from "next/image";
import "../../service-list/online-events.css";

interface CategoryCard {
  title: string;
  description: string;
  image: string | StaticImageData;
}

const CategoryCard = ({ title, description, image }: CategoryCard) => {
  return (
    <section className="online-events-about">
      <div className="online-events-container">
        <div className="online-events-about-grid">
          <div className="online-events-about-content">
            <h2 className="online-events-about-title">{title}</h2>
            <p className="online-events-about-text">
              {description}
            </p>
            <div className="online-events-about-stats">
              <div className="online-events-stat">
                <div className="online-events-stat-number">10K+</div>
                <div className="online-events-stat-label">Events Hosted</div>
              </div>
              <div className="online-events-stat">
                <div className="online-events-stat-number">500K+</div>
                <div className="online-events-stat-label">Participants</div>
              </div>
              <div className="online-events-stat">
                <div className="online-events-stat-number">98%</div>
                <div className="online-events-stat-label">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          <div className="online-events-about-image">
            <Image
              src={image}
              alt={title}
              width={600}
              height={400}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryCard;
