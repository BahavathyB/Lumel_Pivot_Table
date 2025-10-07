import React, { useState } from "react";
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

type Employee = {
  id: number;
  name: string;
  department: string;
  role: string;
  location: string;
  salary: number;
};

const sampleData: Employee[] = [
  { id: 1, name: "Alice", department: "HR", role: "Manager", location: "NY", salary: 75000 },
  { id: 2, name: "Bob", department: "IT", role: "Developer", location: "LA", salary: 90000 },
  { id: 3, name: "Charlie", department: "Finance", role: "Analyst", location: "Chicago", salary: 85000 },
  { id: 4, name: "Diana", department: "IT", role: "Tester", location: "NY", salary: 70000 },
  { id: 5, name: "Ethan", department: "HR", role: "Recruiter", location: "LA", salary: 65000 },
];

const allColumns = ["id", "name", "department", "role", "location", "salary"];

export default function PivotTable() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["name", "department", "role"]);

  const handleColumnChange = (event: any) => {
    const value = event.target.value;
    setVisibleColumns(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        Pivot Table
      </Typography>

      <FormControl>

      </FormControl>

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
              {visibleColumns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: "bold" }}>
                  {col.toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sampleData.map((row) => (
              <TableRow key={row.id}>
                {visibleColumns.map((col) => (
                  <TableCell key={col}>{(row as any)[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
