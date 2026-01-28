import React from 'react';
import { useSelector } from 'react-redux';

import { Menu } from 'antd';
import { RootState, useAppSelector } from '@/store';

const SubcategoryMenu: React.FC = () => {
    const selectedSubcategories = useAppSelector((state: RootState) => state.category.selectedSubcategories);
console.log("selectedSubcategories",selectedSubcategories);

    return (
        <Menu mode="horizontal" disabledOverflow>
            {selectedSubcategories.map((subcategory) => (
                <Menu.Item key={subcategory.id}>
                    {subcategory.name}
                </Menu.Item>
            ))}
        </Menu>
    );
};

export default SubcategoryMenu;