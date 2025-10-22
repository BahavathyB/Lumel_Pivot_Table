import { configureStore } from "@reduxjs/toolkit";
import csvReducer from "./csvSlice";

export const csvStore = configureStore({
  reducer: {
    csv: csvReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof csvStore.getState>;
export type AppDispatch = typeof csvStore.dispatch;
