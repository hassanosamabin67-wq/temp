"use client";

import Header from "@/Components/pages/header";
import { cardsData } from "@/utils/cards";
import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import ServiceCard from "@/Components/pages/services/card";
import CategorySelector from "@/Components/pages/services/left-filter";
import PriceFilter from "@/Components/pages/services/left-filter/price-filter";
import { Card, Carousel } from "antd";
import ServiceList from "@/Components/pages/services/service-list";
import Footer from "@/Components/pages/home/home-footer";

function Page({ params }: any) {
  // const [filteredCards, setFilteredCards] = useState(cardsData);
  // const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // useEffect(() => {
  //   // Apply combined filtering based on keywords and price range
  //   let filtered = cardsData;

  //   if (params?.slug) {
  //     filtered = filtered.filter((card) =>
  //       card.keyword.some((keyword) =>
  //         keyword.toLowerCase().includes(params.slug.toLowerCase())
  //       )
  //     );
  //   }

  //   if (priceRange) {
  //     const [min, max] = priceRange;
  //     filtered = filtered.filter((card) => {
  //       const price = parseInt(card.price.replace(/[^\d]/g, "")); // Parse price as a number
  //       return price >= min && price <= max;
  //     });
  //   }

  //   setFilteredCards(filtered);
  // }, [params?.slug, priceRange]);

  // const handlePriceFilter = (value: string) => {
  //   if (value) {
  //     const [min, max] = value.split("-").map((v) => parseInt(v));
  //     setPriceRange([min, max]);
  //   } else {
  //     setPriceRange(null);
  //   }
  // };

  return (
    <>
      <ServiceList params={params} />
      {/* <Footer /> */}
    </>
  );
}

export default Page;
