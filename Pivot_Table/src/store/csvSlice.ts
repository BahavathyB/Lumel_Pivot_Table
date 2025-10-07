import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CsvState {
    data: any[];
}

const initialState: CsvState = {
    data: []
};

const csvSlice = createSlice({
    name: "csv",
    initialState,
    reducers: {
        setCsvData: (state, action: PayloadAction<any[]>) => {
            state.data = action.payload;
        },
        clearCsvData: (state) => {
            state.data = [];
        }
    }
});

export const {setCsvData, clearCsvData} = csvSlice.actions;
export default csvSlice.reducer;