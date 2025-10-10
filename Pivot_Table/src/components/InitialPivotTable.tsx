import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";

type CSVRow = Record<string, string | number | null | undefined>;


const InitialPivotTable: React.FC = () => {
  const csvData = useSelector((state: RootState) => state.csv.data) as CSVRow[];

  const slicedData = useMemo(() => csvData.slice(0, 100), [csvData]);

  const allColumns = useMemo(() => {
    if (!slicedData || slicedData.length === 0) return [];
    return Object.keys(slicedData[0] ?? {});
  }, [slicedData]);

  if (!csvData.length) {
    return (
      <Typography
        variant="h6"
        sx={{ mt: 5, textAlign: "center", color: "gray" }}
      >
        No CSV data uploaded yet
      </Typography>
    );
  }

  return (
    <Paper sx={{ overflow: "auto", mt: 3 }}>
      <Table sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "primary.main" }}>
            <TableCell
              sx={{
                fontWeight: "bold",
                color: "white",
                backgroundColor: "primary.main",
                minWidth: 60,
                textAlign: "center",
                borderRight: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              S.NO
            </TableCell>
            {allColumns.map((column, index) => (
              <TableCell
                key={column}
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  backgroundColor: "primary.main",
                  minWidth: 120,
                  borderRight: index === allColumns.length - 1 
                    ? "none" 
                    : "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {column.toUpperCase()}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {slicedData.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
            >
              <TableCell
                sx={{
                  fontWeight: "bold",
                  color: "text.secondary",
                  borderRight: "1px solid #e0e0e0",
                  textAlign: "center",
                  minWidth: 60,
                }}
              >
                {rowIndex + 1}
              </TableCell>
              {allColumns.map((column, colIndex) => (
                <TableCell
                  key={`${rowIndex}-${column}`}
                  sx={{
                    minWidth: 120,
                    borderRight: colIndex === allColumns.length - 1 
                      ? "none" 
                      : "1px solid #e0e0e0",
                  }}
                >
                  {String(row[column] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default InitialPivotTable;