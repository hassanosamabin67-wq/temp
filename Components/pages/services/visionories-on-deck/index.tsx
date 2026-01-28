import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";
import { useAppSelector } from "@/store";
import { supabase } from "@/config/supabase";
import VisionaryCard from "./card";

export default function VisionaryOnDeck() {
  const category = useAppSelector((state) => state.category);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (category.selectedCategory) {
      fetchServices();
    }
  }, [category.selectedCategory]);

  const fetchVisionaries = async (profileId:string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*") // Only fetch the visionary's name
      .eq("profileId", profileId)
      .single();

    if (error) {
      console.error("Error fetching visionary:", error);
      return null;
    }
    return data || "Unknown Visionary";
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("service")
      .select("name, description, reviews, video, category, subcategory, profileId")
      .eq("category", category.selectedCategory);

    if (error) {
      console.error("Error fetching services:", error);
      return;
    }

    // Fetch visionaries for each service
    const servicesWithVisionaries:any = await Promise.all(
      data.map(async (service) => {
        const visionaryData = await fetchVisionaries(service.profileId);
        return { ...service, visionaryData };
      })
    );

    setServices(servicesWithVisionaries);
  };

  return (
    <div className="visionary-container">
      <h1 className="visionary-title">Visionaries on Deck</h1>
      <div className="visionary-navigation">
        <Swiper
          className="visionary-swiper"
          spaceBetween={50}
          slidesPerView={3}
          navigation
          modules={[Navigation]}
        >
          {services.map((service, index) => (
            <SwiperSlide key={index}>
              <VisionaryCard data={service} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
