import { useAppDispatch } from "@/store";
import {
  setSelectedCategory,
  setSelectedSubcategories,
} from "@/store/slices/selectedCategory";
import { menuData } from "@/utils/services";
import { Menu } from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import "./style.css";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";
function ServiceHeader() {
  const [current, setCurrent] = useState("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const handleCategoryChange = (categoryId: any) => {
    setCurrent(categoryId.key);
    dispatch(setSelectedCategory(categoryId.key)); // Set selected category in Redux store
    const category = menuData.find((cat) => cat.id === categoryId?.key);
    console.log("category", category);

    // Provide a default value (empty array) if category?.subcategories is undefined
    dispatch(setSelectedSubcategories(category?.subcategories ?? []));

    router.replace(`/services/${category?.category.trim().toLowerCase().replace(/\s+/g, "-")}`); // Redirect to the selected category page
  };

  // Transform menuData to the correct structure for Ant Design Menu
  const allMenu = menuData.map((item) => ({
    label: item.category, // Displayed text
    key: item.id, // Unique key for the menu item
  }));

  console.log("allMenu", allMenu);

  return (
    <MaxWidthWrapper withPadding={false} className="menu-container">
      <Menu
        disabledOverflow
        onClick={handleCategoryChange}
        selectedKeys={[current]}
        mode="horizontal"
        items={allMenu} // Pass transformed menu items
        className="menu"
      />
    </MaxWidthWrapper>
  );
}

export default ServiceHeader;
