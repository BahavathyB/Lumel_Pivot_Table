import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";

const PivotTable = () => {
  const csvData = useSelector((state: RootState) => state.csv.data);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  let slicedData = csvData.slice(0, 20);

  const allColumns = useMemo(() => {
    if(!slicedData || slicedData.length === 0) return [];
    return Object.keys(slicedData[0]);
  }, [csvData])

  const handleColumnChange = (event: any) => {
    const value = event.target.value;
    setVisibleColumns(typeof value === "string" ? value.split(",") : value);
  };

  if(!slicedData || slicedData.length === 0){
    return (
      <Typography
      variant="h6"
      sx={{ mt: 5, textAlign: "center", color: "gray" }}
      >
        No CSV Data uploaded yet.
      </Typography>
    )
  }

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        CSV Data Viewer
      </Typography>

      <FormControl sx={{ minWidth: 300, mb: 3 }}>
        <InputLabel id="columns-label">Select Columns</InputLabel>
        <Select
          labelId="columns-label"
          multiple
          value={visibleColumns}
          onChange={handleColumnChange}
          renderValue={(selected) => selected.join(", ")}
        >
          {allColumns.map((col) => (
            <MenuItem key={col} value={col}>
              {col}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {(visibleColumns.length ? visibleColumns : allColumns).map((col) => (
                <TableCell key={col} sx={{ fontWeight: "bold" }}>
                  {col.toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {slicedData.map((row: any, index: number) => (
              <TableRow key={index}>
                {(visibleColumns.length ? visibleColumns : allColumns).map(
                  (col) => (
                    <TableCell key={col}>{row[col]}</TableCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PivotTable;
