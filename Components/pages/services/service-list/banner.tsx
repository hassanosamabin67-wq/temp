import { useAppSelector } from "@/store";
import { menuData } from "@/utils/services";
import React, { useEffect, useState } from "react";
import "./online-events.css";

function Banner() {
  const [categoryDetails, setCategoryDetails] = useState<any>([]);

  const category = useAppSelector((state) => state.category.selectedCategory!);

  const getCateogryData = async () => {
    const categoryData = await menuData.find(
      (cat) => cat.id?.toLowerCase() === category.toLowerCase()
    );
    setCategoryDetails(categoryData);
  };

  useEffect(() => {
    getCateogryData();
  }, [category]);

  return (
    <section 
      className="online-events-hero"
    >
      <div className="online-events-hero-overlay" />
      <div className="online-events-hero-content">
        <h1 className="online-events-hero-title">{categoryDetails?.category || 'Services'}</h1>
        <p className="online-events-hero-subtitle">
          {categoryDetails?.tagline || 'Discover amazing services'}
        </p>
        <button className="online-events-hero-btn">
          Get Started Today
        </button>
      </div>
    </section>
  );
}

export default Banner;
