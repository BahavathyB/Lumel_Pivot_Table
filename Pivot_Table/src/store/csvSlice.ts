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
        setCsvData: (state, action: PayloadAction<{ data: any[]; filename: string }>) => {
            state.data = action.payload.data;
            state.filename = action.payload.filename;
        },
        clearCsvData: (state) => {
            state.data = [];
            state.filename = "";
        }
    }
});

export const {setCsvData, clearCsvData} = csvSlice.actions;
export default csvSlice.reducer;