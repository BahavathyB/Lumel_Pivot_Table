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
import "../styles/ExcelView.css";

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
  csvData,
  allColumns,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const paginatedExcelData = csvData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box className="excel-view-container">
      <TableContainer className="excel-table-container">
        <Table stickyHeader className="excel-table">
          <TableHead>
            <TableRow>
              {allColumns.map((column) => (
                <TableCell
                  key={column}
                  className="excel-table-head-cell"
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
                className={index % 2 ? "excel-table-row-even" : "excel-table-row-odd"}
              >
                {allColumns.map((column) => (
                  <TableCell
                    key={column}
                    className="excel-table-body-cell"
                  >
                    {String(row[column] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper className="excel-pagination-container">
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={csvData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className="excel-table-pagination"
        />
      </Paper>
    </Box>
  );
};

export default ExcelView;