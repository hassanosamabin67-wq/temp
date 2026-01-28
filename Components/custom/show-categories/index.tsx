import { menuData } from '@/utils/services';
import React from 'react';

// Assuming 'Tag' is a component you have that accepts children to display
const Tag = ({ children }:any) => <div style={{ margin: '10px', padding: '5px', border: '1px solid grey', borderRadius: '5px' }}>{children}</div>;

const ShowSubcategories = ({ categoryId }:any) => {
  // Find the category with the specified ID
  const category = menuData.find(cat => cat.id === categoryId);

  // Check if category is found and has subcategories
  if (category && category.subcategories) {
    return (
      <div>
        {category.subcategories.map(subcat => (
          <Tag key={subcat.id}>{subcat.name}</Tag> // Render each subcategory name inside a Tag component
        ))}
      </div>
    );
  }

  return <div>No subcategories found for this category.</div>;
};

export default ShowSubcategories;
