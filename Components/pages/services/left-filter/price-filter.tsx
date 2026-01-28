import React, { useState } from "react";
import { Select, Card } from "antd";
import "./style.css"
const { Option } = Select;

interface PriceFilterProps {
  onFilter: (value: string) => void;
}

const PriceFilter: React.FC<PriceFilterProps> = ({ onFilter }) => {
  const [selectedRange, setSelectedRange] = useState<string | null>(null);

  const handlePriceChange = (value: string) => {
    setSelectedRange(value);
    onFilter(value);
  };

  return (
    <div style={{ padding: 24 }}>
      <label>Price Range</label>
      <Select
        placeholder="Select a price range"
        className="category-select"
        onChange={handlePriceChange}
        value={selectedRange}
      >
        <Option value="0-1000">$0 - $1,000</Option>
        <Option value="1000-5000">$1,000 - $5,000</Option>
        <Option value="5000-10000">$5,000 - $10,000</Option>
        <Option value="10000-50000">$10,000 - $50,000</Option>
        <Option value="50000-100000">$50,000 - $100,000</Option>
      </Select>
    </div>

  );
};

export default PriceFilter;
