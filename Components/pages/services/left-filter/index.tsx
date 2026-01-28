import React from "react";
import { Card, Row, Col, Select, Checkbox } from "antd";
import { menuData } from "@/utils/services";
import { useAppDispatch } from "@/store";
import { setSelectedSubcategory } from "@/store/slices/selectedCategory";
import "./style.css"
const { Option } = Select;

const CategorySelector = ({ handleSubCategory, handleCategoryChange, selectedCategory, subcategories }:any) => {
  return (
    <Card className="category-card">
      {/* Main Category Selector */}
      <div className="main-category">
        <label>Main Category</label>
        <Select
          className="category-select"
          placeholder="Select a Category"
          onChange={handleCategoryChange}
          value={selectedCategory}
        >
          {menuData.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.category}
            </Option>
          ))}
        </Select>
      </div>

      {/* Subcategories List */}
      {subcategories?.length > 0 && (
        <div className="subcategory-container">
          <label>Subcategories</label>
          {subcategories.map((subcategory:any) => (
            <Checkbox
              className="subcategory-checkbox"
              value={subcategory.id}
              onChange={(e) => handleSubCategory(e)}
              key={subcategory.id}
            >
              {subcategory.name}
            </Checkbox>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CategorySelector;
