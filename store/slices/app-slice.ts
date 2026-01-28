import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  currency: string;
  language: string;
}

const initialState: AppState = {
  currency: "CRC",
  language: "en",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    resetAppSettings: () => initialState,
  },
});

export const { setCurrency, setLanguage, resetAppSettings } = appSlice.actions;

export default appSlice.reducer;