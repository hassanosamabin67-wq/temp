import React, { useMemo } from "react";
import CollabSessionCard from "../collab-session-card";
import "./style.css"; // Include additional styles
import { useAppSelector } from "@/store";
import { categories, menuData, sessions } from "@/utils/services";

export default function CollabSessionsSection() {
  const category = useAppSelector((state)=>state.category.selectedCategory)
  const categoryName = useMemo(() =>
  menuData.find((cat)=>cat.id == category),
  [category]
);
  const filteredCategory = useMemo(() =>
    sessions.filter((sessioncategory) => sessioncategory.categoryId == category),
    [category]
  );
  

  const handleViewCalendar = () => {
    window.open("https://example.com/music-calendar", "_blank");
  };

  return (
    <div className="collab-sessions-section">
      <h2 className="section-title">Collab Sessions for {categoryName?.category} </h2>
      <div className="sessions-container">
        {filteredCategory.map((session, index) => (
          <CollabSessionCard key={index} session={session} />
        ))}
      </div>
    </div>
  );
}
