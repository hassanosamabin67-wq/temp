"use client";
import Footer from "@/Components/pages/home/home-footer";
import ServiceList from "@/Components/pages/services/service-list";
import Banner from "@/Components/pages/services/service-list/banner";
import SubCategories from "@/Components/pages/services/sub-category";
import React, { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setSelectedCategory, setSelectedSubcategories } from "@/store/slices/selectedCategory";
import { menuData } from "@/utils/services";

function ServicePageSlug({ params }: any) {
  const dispatch = useAppDispatch();
  const { slug } = params;

  useEffect(() => {
    // Convert slug back to category name and find matching category
    const categoryName = slug
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/And/g, '&'); // Handle "Creative Marketing & Strategy"

    const category = menuData.find((cat) =>
      cat.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') === slug
    );

    if (category) {
      dispatch(setSelectedCategory(category.id));
      dispatch(setSelectedSubcategories(category.subcategories ?? []));
    }
  }, [slug, dispatch]);

  return (
    <>
      <Banner />
      <div>
        <SubCategories />
        {/* <ServiceList  /> */}
      </div>
    </>
  );
}

export default ServicePageSlug;
