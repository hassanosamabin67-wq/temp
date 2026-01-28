import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, MenuProps, Popover } from 'antd';
import React from 'react';
import "./style.css"
import { useRouter } from 'next/navigation';
import { menuData } from '@/utils/services';
const ServicesDropdown = () => {
    const router = useRouter();

    const items: MenuProps["items"] = menuData.map((item, index) => ({
      key: `category-${index}`,
      label: item.category,
      children: item.subcategories.map((sub, subIndex) => ({
        key: `${index}-${subIndex}`,
        label: sub.name,
        onClick: () => router.push(`/services/${item.category}/${sub.id}`),
      })),
    }));
  
    return (
      <Dropdown menu={{items}} trigger={["hover"]}>
        <div
          onClick={(e) => e.preventDefault()}
          className="menu-item"
        >
          Services <DownOutlined size={12} />
        </div>
      </Dropdown>
    );
  };
  
  export default ServicesDropdown;
