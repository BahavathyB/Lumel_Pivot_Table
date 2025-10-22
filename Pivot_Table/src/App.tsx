import React from "react";
import { useSelector } from "react-redux";
import PivotTable from "./components/PivotTable";
import UploadFile from "./components/UploadFile";
import NavBar from "./components/NavBar";
import { Box } from "@mui/material";
import type { RootState } from "./store/csvStore";
import useDisableScroll from "./customHooks/useDisableScroll";

function App() {
  const csvData = useSelector((state: RootState) => state.csv.data);
  const hasData = csvData && csvData.length > 0;

  useDisableScroll(true);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "110vh",
      }}
    >
      <NavBar />
      <Box sx={{ flex: 1, overflow: "hidden", maxHeight: "80%" }}>
        {!hasData ? <UploadFile /> : <PivotTable />}
      </Box>
    </Box>
  );
}

export default App;
