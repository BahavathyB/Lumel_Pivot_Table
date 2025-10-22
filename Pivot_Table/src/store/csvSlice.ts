import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CsvState {
  data: any[];
  filename: string;
}

const initialState: CsvState = {
  data: [],
  filename: "",
};

const csvSlice = createSlice({
  name: "csv",
  initialState,
  reducers: {
    setCsvData: (
      state,
      action: PayloadAction<{ data: any[]; filename: string }>
    ) => {
      state.data = action.payload.data;
      state.filename = action.payload.filename;
    },
    clearCsvData: (state) => {
      state.data = [];
      state.filename = "";
    },
    setFilename: (state, action: PayloadAction<string>) => {
      state.filename = action.payload;
    },
  },
});

export const { setCsvData, clearCsvData, setFilename } = csvSlice.actions;
export default csvSlice.reducer;
