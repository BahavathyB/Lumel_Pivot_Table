import React from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Box,
} from "@mui/material";

type CSVRow = Record<string, string | number | null | undefined>;

interface ExcelViewProps {
  csvData: CSVRow[];
  allColumns: string[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ExcelView: React.FC<ExcelViewProps> = ({
  csvData = [],
  allColumns = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const paginatedExcelData = (csvData || []).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 2, overflow: "auto" }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "primary.main",
                  textAlign: "center",
                  borderRight: "2px solid rgba(255,255,255,0.5)",
                  minWidth: 80,
                  position: "sticky",
                  left: 0,
                  zIndex: 1200,
                }}
              >
                Excel View
              </TableCell>
              {allColumns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    textAlign: "center",
                    borderLeft: "1px solid rgba(255,255,255,0.3)",
                    borderRight: "1px solid rgba(255,255,255,0.3)",
                    minWidth: 120,
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedExcelData.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: index % 2 ? "action.hover" : "background.default",
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.light",
                    color: "white",
                    borderRight: "1px solid #e0e0e0",
                    minWidth: 80,
                    position: "sticky",
                    left: 0,
                    zIndex: 1100,
                  }}
                >
                  {page * rowsPerPage + index + 1}
                </TableCell>
                {allColumns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      borderRight: "1px solid #e0e0e0",
                      minWidth: 120,
                    }}
                  >
                    {String(row[column] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={csvData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{
          borderTop: "1px solid #e0e0e0",
          justifyContent: "flex-start",
        }}
      />
    </Paper>
  );
};

export default ExcelView;