import { useAppSelector } from "@/store";
import { menuData } from "@/utils/services";
import { Calendar, Megaphone, Monitor, Mic, ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import "../service-list/online-events.css";
import CategoryDescription from "../service-description";
import Loading from "@/Components/custom/custom-loading";
import RelatedCollabRooms from "../service-list/RelatedCollabRooms";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";

function SubCategories() {
  const categoryParam = useAppSelector(
    (state) => state.category.selectedCategory
  );
  const subcategories = useAppSelector(
    (state) => state.category.selectedSubcategories
  );
  const cardsPerPage = 4;
  const [currentpage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  const startIndex = (currentpage - 1) * cardsPerPage;
  const displayedCards = subcategories.slice(
    startIndex,
    startIndex + cardsPerPage
  );

  const getCategoryDetails = async () => {
    const categoryDetails = menuData.find((data) => data.id === categoryParam);
    setCategoryName(categoryDetails?.category!);
    setSelectedCategory(categoryDetails);
  };

  useEffect(() => {
    getCategoryDetails();
  }, [categoryParam]);

  if (!categoryName) {
    return <Loading size="large" fullscreen />;
  }

  const getIconForSubcategory = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('planning')) return Calendar;
    if (nameLower.includes('promotion')) return Megaphone;
    if (nameLower.includes('tech') || nameLower.includes('stream')) return Monitor;
    if (nameLower.includes('hosting') || nameLower.includes('moderation')) return Mic;
    return Calendar; // default
  };

  return (
    <div className="online-events-page">
      <section className="online-events-services">
        <div className="online-events-container">
          <h2 className="online-events-section-title">Explore {categoryName}</h2>
          <p className="online-events-section-subtitle">
            Comprehensive solutions for your {categoryName?.toLowerCase()} needs
          </p>

          <div className="online-events-grid">
            {displayedCards?.map((subcategory: any, index: number) => {
              const IconComponent = getIconForSubcategory(subcategory.name);
              return (
                <div key={index} className="online-events-card-wrapper">
                  <div className="online-events-card">
                    <div className="online-events-card-icon">
                      <IconComponent size={48} />
                    </div>
                    <h3 className="online-events-card-title">{subcategory.name}</h3>
                    <ul className="online-events-card-list">
                      {subcategory?.childCategories?.map(
                        (child: any, childIndex: number) => (
                          <Link
                            key={childIndex}
                            href={`${categoryName}/${child.name}`}
                            className="online-events-card-item"
                          >
                            {child.name}
                          </Link>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CategoryDescription />
      <RelatedCollabRooms category={categoryName} />
    </div>
  );
}

export default SubCategories;
