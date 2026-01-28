import React, { useState, useCallback, useMemo } from "react";
import { Input, List, Avatar, Dropdown } from "antd";
import { useRouter } from "next/navigation";
import { supabase } from "@/config/supabase";
import debounce from "lodash.debounce";
import { useAppDispatch } from "@/store";
import { setSelectedCategory } from "@/store/slices/selectedCategory";
import styles from '../header.module.css'

const { Search } = Input;

interface Service {
  id: string;
  name: string;
  category: string;
  image?: string;
  description?: string;
}

const SearchComponent = () => {
  const [results, setResults] = useState<Service[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const fetchResults = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setDropdownVisible(false);
      return;
    }

    const { data, error } = await supabase
      .from("service")
      .select("*")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (error) {
      console.error("Supabase error:", error);
      setResults([]);
      setDropdownVisible(false);
      return;
    }

    console.log("Supabase data:", data);
    setResults(data || []);
    setDropdownVisible((data?.length ?? 0) > 0);
  };

  const debouncedSearch = useMemo(() => debounce(fetchResults, 400), []);

  const handleSearch = useCallback((value: string) => {
    if (typeof window === "undefined") return;
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleResultClick = (id: string) => {
    console.log("hit");
    console.log(id, "id");
    router.push(`/services/subcategory/${id}`);
    setDropdownVisible(false);
  };

  const dropdownContent = (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 4,
        maxHeight: 300,
        overflowY: "auto",
        width: 300,
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={results}
        renderItem={(item: Service) => (
          <List.Item
            onClick={(e) => {
              e.stopPropagation();
              handleResultClick(item.name);
                  dispatch(setSelectedCategory(item.category));
            }}
            style={{
              cursor: "pointer",
              padding: "8px 16px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <List.Item.Meta
              avatar={<Avatar src={item.image} />}
              title={item.name}
              description={item.category}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      open={dropdownVisible}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <Search
        placeholder="Search..."
        allowClear
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ width: 300 }}
        className={styles.searchBar}
        onBlur={() => setTimeout(() => setDropdownVisible(false), 300)}
        onFocus={() => {
          if (results.length > 0) setDropdownVisible(true);
        }}
      />
    </Dropdown>
  );
};

export default SearchComponent;