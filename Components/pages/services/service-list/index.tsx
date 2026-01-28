import React, { useEffect, useMemo, useState } from "react";
import { Pagination, Select } from "antd";
import { menuData } from "@/utils/services";
import styles from "./style.module.css";
import { supabase } from "@/config/supabase";
import VisionaryCard from "../visionories-on-deck/card";
import Banner from "./banner";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";

const { Option } = Select;

type Service = {
  id: string;
  name: string;
  description: string;
  reviews: number;
  video?: string;
  category?: string;
  subcategory?: string;
  profileId: string;
  visionaryData?: any;
  pricing_packages?: Array<{
    key: string;
    label: string;
    price?: number;
    title?: string;
    serviceDeliveryTime?: string;
    addOns?: Array<{
      id: string;
      name: string;
      price?: number;
      enabled?: boolean;
      description?: string;
    }>;
    description?: string;
  }>;
};

function ServiceList({ params }: any) {
  const [routeParams, setRouteParams] = useState<any>(null);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");
  const [selectedFilterSubCategory, setSelectedFilterSubCategory] = useState<string>("all");
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");

  // data
  const [cardsData, setCardsData] = useState<Service[]>([]);
  const [filteredCards, setFilteredCards] = useState<Service[]>([]);

  // paging
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [currentSecondPage, setSecondCurrentPage] = useState(1);

  // Parse "24 Hours", "3 Days", "7 Days", "14+ Days" → numeric days
  const parseDurationToDays = (raw?: string): number => {
    if (!raw) return Infinity;
    const s = raw.trim().toLowerCase();

    // handle things like "14+ days"
    const plusMatch = s.match(/(\d+)\s*\+\s*day/);
    if (plusMatch) return parseInt(plusMatch[1], 10);

    const dayMatch = s.match(/(\d+)\s*day/);
    if (dayMatch) return parseInt(dayMatch[1], 10);

    const hourMatch = s.match(/(\d+)\s*hour/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1], 10);
      return hours / 24; // treat 24h as 1 day, 12h as 0.5 day, etc.
    }

    // Fallback: try any leading number
    const num = parseInt(s, 10);
    return Number.isFinite(num) ? num : Infinity;
  };

  // Given a package array, return the best (min) delivery in days
  const getBestDeliveryDaysFromPackages = (packages?: Service["pricing_packages"]): number => {
    if (!packages || packages.length === 0) return Infinity;
    return packages.reduce((min, p) => {
      const d = parseDurationToDays(p.serviceDeliveryTime);
      return d < min ? d : min;
    }, Infinity);
  };

  // Given a package array, return the min price
  const getMinPriceFromPackages = (packages?: Service["pricing_packages"]): number => {
    if (!packages || packages.length === 0) return Infinity;
    let min = Infinity;
    for (const p of packages) {
      if (typeof p.price === "number") {
        if (p.price < min) min = p.price;
      }
    }
    return min;
  };

  // Delivery filter check using best delivery among packages
  const matchesDeliveryTimeFromPackages = (
    packages: Service["pricing_packages"],
    filter: string
  ): boolean => {
    if (!filter || filter === "all") return true;
    const bestDays = getBestDeliveryDaysFromPackages(packages);

    switch (filter) {
      case "24 Hours":
        // <= 1 day
        return bestDays <= 1;
      case "3 Days":
        return bestDays <= 3;
      case "7 Days":
        return bestDays <= 7;
      case "14+ Days":
        // >= 14 days
        return bestDays >= 14 && bestDays !== Infinity;
      default:
        return true;
    }
  };

  // Price filter check using min price among packages
  const matchesPriceRangeFromPackages = (
    packages: Service["pricing_packages"],
    filter: string
  ): boolean => {
    if (!filter || filter === "all") return true;
    const minPrice = getMinPriceFromPackages(packages);
    if (!Number.isFinite(minPrice)) return false;

    switch (filter) {
      case "$0–$50":
        return minPrice >= 0 && minPrice <= 50;
      case "$51–$100":
        return minPrice >= 51 && minPrice <= 100;
      case "$101–$250":
        return minPrice >= 101 && minPrice <= 250;
      case "$251+":
        return minPrice >= 251;
      default:
        return true;
    }
  };

  // Resolve params if it's a Promise and normalize
  useEffect(() => {
    let cancelled = false;

    const resolveParams = async () => {
      try {
        const raw = typeof params?.then === "function" ? await params : params;
        if (cancelled) return;

        // Expecting: { slug: 'Online%20Event%20Planning', subservices: 'online-wedding-planning' }
        const decodedSlug = raw?.slug ? decodeURIComponent(String(raw.slug)) : null;
        const decodedSub = raw?.subservices ? decodeURIComponent(String(raw.subservices)) : null;

        setRouteParams({ slug: decodedSlug, subservices: decodedSub });

        // Seed filters from params (if present)
        if (decodedSlug) {
          setSelectedFilterCategory(decodedSlug);
        } else {
          setSelectedFilterCategory("all");
        }
        if (decodedSub) {
          setSelectedFilterSubCategory(decodedSub);
        } else {
          setSelectedFilterSubCategory("all");
        }
      } catch (e) {
        // If anything goes wrong, just fall back to "all"
        setRouteParams(null);
        setSelectedFilterCategory("all");
        setSelectedFilterSubCategory("all");
      }
    };

    resolveParams();
    return () => {
      cancelled = true;
    };
  }, [params]);

  // menu options
  const allMenu = useMemo(
    () =>
      menuData.map((item) => ({
        label: item.category,
        key: item.id,
      })),
    []
  );

  const availableCategories = useMemo(
    () => [{ key: "all", label: "All Categories" }, ...allMenu],
    [allMenu]
  );

  // Collect child categories according to currently selected category
  const availableSubCategories = useMemo(() => {
    if (!selectedFilterCategory || selectedFilterCategory === "all") {
      const allChild = menuData.flatMap((cat) =>
        cat.subcategories?.flatMap((sub) =>
          sub.childCategories?.map((child) => ({
            id: child.id,
            key: child.name,
            name: child.name,
            categoryId: child.categoryId,
            subcategoryId: child.subcategoryId,
          })) || []
        ) || []
      );
      return [...allChild];
    }

    const catData = menuData.find(
      (c) => c.category?.toLowerCase() === selectedFilterCategory?.toLowerCase()
    );
    const child = catData?.subcategories?.flatMap((sub) =>
      sub.childCategories?.map((child) => ({
        id: child.id,
        key: child.name,
        name: child.name,
        categoryId: child.categoryId,
        subcategoryId: child.subcategoryId,
      })) || []
    ) || [];

    return [...child];
  }, [selectedFilterCategory]);

  // Fetch visionary for each service row
  const fetchVisionaries = async (profileId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("profileId", profileId)
      .single();

    if (error) {
      console.error("Error fetching visionary:", error);
      return null;
    }
    return data || "Unknown Visionary";
  };

  // Fetch services when category/subcategory change or when params arrive
  useEffect(() => {
    const fetchServices = async () => {
      // Build base query
      let query = supabase
        .from("service")
        .select("id, name, description, reviews, video, category, subcategory, profileId, pricing_packages")
        .eq("visibility", "PUBLIC")

      // Category filter at DB level (skip if "all")
      if (selectedFilterCategory && selectedFilterCategory !== "all") {
        // Use ilike for case-insensitive match
        query = query.ilike("category", selectedFilterCategory);
      }

      // Subcategory (child) filter at DB level too (skip if "all")
      if (selectedFilterSubCategory && selectedFilterSubCategory !== "all") {
        query = query.ilike("subcategory", selectedFilterSubCategory);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching services:", error);
        setCardsData([]);
        return;
      }

      const withVisionaries = await Promise.all(
        (data || []).map(async (service: Service) => {
          const visionaryData = await fetchVisionaries(service.profileId);
          return { ...service, visionaryData };
        })
      );

      setCardsData(withVisionaries);
    };

    // Only fetch after params resolved (or if there were no params)
    if (routeParams !== null || params === undefined) {
      fetchServices();
    }
  }, [routeParams, selectedFilterCategory, selectedFilterSubCategory]); // eslint-disable-line

  // Apply client-side filters (search, category, subcategory, delivery time, and price)
  useEffect(() => {
    let filtered = [...cardsData];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.name?.toLowerCase().includes(s) ||
          card.description?.toLowerCase().includes(s) ||
          card.visionaryData?.name?.toLowerCase().includes(s)
      );
    }

    if (selectedFilterCategory !== "all") {
      filtered = filtered.filter(
        (card) => card.category?.toLowerCase() === selectedFilterCategory.toLowerCase()
      );
    }

    if (selectedFilterSubCategory !== "all") {
      filtered = filtered.filter(
        (card) => card.subcategory?.toLowerCase() === selectedFilterSubCategory.toLowerCase()
      );
    }

    // NEW: delivery time via pricing_packages
    if (selectedDeliveryTime !== "all") {
      filtered = filtered.filter((card) =>
        matchesDeliveryTimeFromPackages(card.pricing_packages, selectedDeliveryTime)
      );
    }

    // NEW: price range via pricing_packages
    if (selectedPriceRange !== "all") {
      filtered = filtered.filter((card) =>
        matchesPriceRangeFromPackages(card.pricing_packages, selectedPriceRange)
      );
    }

    setFilteredCards(filtered);
    setCurrentPage(1);
  }, [cardsData, searchTerm, selectedFilterCategory, selectedFilterSubCategory, selectedDeliveryTime, selectedPriceRange]);

  // Reset subcategory when category changes (but keep the param-seeded subcategory on first load)
  useEffect(() => {
    // If routeParams seeded a subcategory, don't wipe it immediately on the first pass
    if (routeParams?.subservices) return;
    if (selectedFilterCategory === "all") {
      setSelectedFilterSubCategory("all");
    } else {
      // keep current subcat unless it's now invalid
      const valid = availableSubCategories.some(
        (s) => s.name?.toLowerCase?.() === selectedFilterSubCategory.toLowerCase()
      );
      if (!valid) setSelectedFilterSubCategory("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterCategory]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleOnChangePage = (page: number) => setSecondCurrentPage(page);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  const handleFilterCategoryChange = (value: string) => {
    const newVal = value || "all";
    setSelectedFilterCategory(newVal);
  };

  const handleFilterSubCategoryChange = (value: string) => {
    setSelectedFilterSubCategory(value || "all");
  };

  const handleDeliveryTimeChange = (value: string) => {
    setSelectedDeliveryTime(value || "all");
  };

  const handlePriceRangeChange = (value: string) => {
    setSelectedPriceRange(value || "all");
  };

  // Reset all filters function
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedFilterCategory("all");
    setSelectedFilterSubCategory("all");
    setSelectedDeliveryTime("all");
    setSelectedPriceRange("all");
  };

  // Pagination slices
  const currentCards = useMemo(
    () => filteredCards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredCards, currentPage]
  );

  const totalCards = cardsData.length;
  const cardsPerPage = 3;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const startIndex = (currentSecondPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const paginatedServices = useMemo(
    () => cardsData.slice(startIndex, endIndex),
    [cardsData, startIndex, endIndex]
  );

  return (
    <div className={styles.container}>
      <div className={styles.paddingContainer}>
        <MaxWidthWrapper withPadding={false}>
          <Banner />
          <section className={styles.filterSection}>
            <span className={styles.filterTitle}>Find Your Perfect Service</span>

            {/* Select Filters */}
            <div className={styles.filterMain}>
              <div className={styles.filterDiv}>
                <div className={styles.searchBar}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    className={`${styles.filterInputs} ${styles.searchInput}`}
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <span style={{ fontWeight: 500, minWidth: "70px" }}>Category:</span>
                <Select
                  value={selectedFilterCategory}
                  onChange={handleFilterCategoryChange}
                  style={{ width: 220 }}
                  placeholder="Select category"
                  allowClear
                  onClear={() => handleFilterCategoryChange("all")}
                  className={`${styles.selectInput} select-input`}
                >
                  {availableCategories.map((cat) => (
                    <Option key={cat.key} value={cat.label}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className={styles.filterDiv}>
                <span style={{ fontWeight: 500, minWidth: "90px" }}>Subcategory:</span>
                <Select
                  value={selectedFilterSubCategory}
                  onChange={handleFilterSubCategoryChange}
                  style={{ width: 240 }}
                  placeholder="Select subcategory"
                  allowClear
                  disabled={availableSubCategories.length <= 1}
                  className={`select-input`}
                >
                  {availableSubCategories.map((subCat) => (
                    <Option key={subCat.id} value={subCat.name}>
                      {subCat.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <Select
                placeholder="Delivery Time"
                style={{ width: "130px" }}
                allowClear
                value={selectedDeliveryTime === "all" ? undefined : selectedDeliveryTime}
                onChange={handleDeliveryTimeChange}
                onClear={() => handleDeliveryTimeChange("all")}
                className={`select-input`}
              >
                <Option value='24 Hours'>24 Hours</Option>
                <Option value='3 Days'>3 Days</Option>
                <Option value='7 Days'>7 Days</Option>
                <Option value='14+ Days'>14+ Days</Option>
              </Select>

              <Select
                placeholder="Price Range"
                style={{ width: "130px" }}
                allowClear
                value={selectedPriceRange === "all" ? undefined : selectedPriceRange}
                onChange={handlePriceRangeChange}
                onClear={() => handlePriceRangeChange("all")}
                className={`select-input`}
              >
                <Option value='$0–$50'>$0 – $50</Option>
                <Option value='$51–$100'>$51 – $100</Option>
                <Option value='$101–$250'> $101 – $250</Option>
                <Option value='$251+'>$251+</Option>
              </Select>

              <button
                onClick={handleResetFilters}
                className={styles.resetBtn}
              >
                Reset Filters
              </button>
            </div>

            {/* Results Info */}
            <div
              style={{
                padding: "12px 0",
                borderTop: "1px solid #f0f0f0",
                fontSize: "14px",
              }}
            >
              {filteredCards.length > 0 ? (
                <>
                  Showing {filteredCards.length} services
                  {searchTerm && (
                    <span style={{ marginLeft: 8 }}>
                      for "<strong>{searchTerm}</strong>"
                    </span>
                  )}
                  {selectedFilterCategory !== "all" && (
                    <span style={{ marginLeft: 8 }}>
                      in <strong>{selectedFilterCategory}</strong>
                    </span>
                  )}
                  {selectedFilterSubCategory !== "all" && (
                    <span style={{ marginLeft: 8 }}>
                      → <strong>{selectedFilterSubCategory}</strong>
                    </span>
                  )}
                  {selectedDeliveryTime !== "all" && (
                    <span style={{ marginLeft: 8 }}>
                      • <strong>{selectedDeliveryTime}</strong> delivery
                    </span>
                  )}
                  {selectedPriceRange !== "all" && (
                    <span style={{ marginLeft: 8 }}>
                      • <strong>{selectedPriceRange}</strong>
                    </span>
                  )}
                </>
              ) : (
                "No services found with current filters"
              )}
            </div>
          </section>

          {filteredCards && filteredCards.length > 0 ? (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", margin: "50px 0", justifyContent: "center" }}>
                {currentCards.map((card, index) => (
                  <VisionaryCard key={card.id || index} data={card} />
                ))}
              </div>
              <div>
                <Pagination
                  current={currentPage}
                  pageSize={itemsPerPage}
                  total={filteredCards.length}
                  onChange={handlePageChange}
                  className={styles.pagination}
                  align="center"
                />
              </div>
            </div>
          ) : (
            <div style={{
              height: "400px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "24px",
              fontWeight: "500",
            }}>
              No services found with current filters
            </div>
          )}
        </MaxWidthWrapper>
      </div>
    </div>
  );
}

export default ServiceList;