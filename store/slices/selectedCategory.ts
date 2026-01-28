import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Subcategory {
  id: string;
  name: string;
  image: any;
  childCategories:childCategories[]
}
interface childCategories {
  id: string;
  categoryId:string;
  subcategoryId:string
  name: string;
}
interface CategoryState {
  selectedCategory: string | null;
  selectedSubcategories: Subcategory[]; // Updated type
  selectedSubCategory: Subcategory | null; // Updated type
  selectePrice: string | null;
}

const initialState: CategoryState = {
  selectedCategory: null,
  selectedSubcategories: [],
  selectedSubCategory: null,
  selectePrice: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
    setSelectedSubcategories(state, action: PayloadAction<Subcategory[]>) {
      state.selectedSubcategories = action.payload;
    },
    setSelectedSubcategory(state, action: PayloadAction<Subcategory | null>) {
      state.selectedSubCategory = action.payload;
    },
    setSelectedPrice(state, action: PayloadAction<string | null>) {
      state.selectePrice = action.payload;
    },
  },
});

export const {
  setSelectedCategory,
  setSelectedSubcategories,
  setSelectedSubcategory,
  setSelectedPrice,
} = categorySlice.actions;
export default categorySlice.reducer;
