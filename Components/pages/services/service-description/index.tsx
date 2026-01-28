import React from "react";
import { Layout } from "antd";
import { categoriesContent } from "@/utils/services";
import CategoryCard from "./description-card";
import { useAppSelector } from "@/store";
import styles from "./style.module.css";

const { Content } = Layout;

const CategoryDescription = () => {
  const categoryId = useAppSelector((state) => state.category.selectedCategory);

  return (
    <Content className={styles.content}>
      {categoriesContent
        .filter((category) => category?.id == categoryId)
        .map((item, index) => (
          <CategoryCard
            key={index}
            title={item.title}
            description={item.description}
            image={item.image}
            // className={styles.categoryCard}
          />
        ))}
    </Content>
  );
};

export default CategoryDescription;
