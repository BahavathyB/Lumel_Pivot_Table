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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TableContainer 
        sx={{ 
          flex: 1,
          maxHeight: "calc(100% - 52px)", 
          position: "relative",
          overflow: "auto",
          "& .MuiTable-root": {
            tableLayout: "auto", 
          },
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f5f5f5",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: "3px",
            "&:hover": {
              background: "#a8a8a8",
            },
          },
          "&::-webkit-scrollbar-corner": {
            background: "#f5f5f5",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "#c1c1c1 #f5f5f5",
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "auto" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "primary.main",
                  textAlign: "center",
                  borderRight: "2px solid rgba(255,255,255,0.5)",
                  fontSize: "0.75rem", 
                  height: "32px", 
                  padding: "4px 8px", 
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
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
                    fontSize: "0.75rem", 
                    height: "32px", 
                    padding: "4px 8px", 
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: "auto", 
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
                  height: "32px", 
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.light",
                    color: "white",
                    borderRight: "1px solid #e0e0e0",
                    fontSize: "0.75rem", 
                    height: "32px", 
                    padding: "4px 8px", 
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    position: "sticky",
                    left: 0,
                    zIndex: 1100,
                    minWidth: "auto", 
                  }}
                >
                  {page * rowsPerPage + index + 1}
                </TableCell>
                {allColumns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      borderRight: "1px solid #e0e0e0",
                      fontSize: "0.75rem", 
                      height: "32px", 
                      padding: "4px 8px", 
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: "auto", 
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

      <Paper 
        elevation={0}
        sx={{ 
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "white",
          position: "sticky",
          bottom: 0,
          zIndex: 100,
          minHeight: "44px", 
          display: "flex",
          alignItems: "center",
        }}
      >
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={csvData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{
            width: "100%",
            "& .MuiTablePagination-toolbar": {
              minHeight: "44px", 
              justifyContent: "flex-start",
              padding: "0 12px", 
            },
            "& .MuiTablePagination-spacer": {
              flex: "none",
            },
            "& .MuiTablePagination-selectLabel": {
              margin: 0,
              fontSize: "0.75rem", 
            },
            "& .MuiTablePagination-displayedRows": {
              margin: 0,
              fontSize: "0.75rem", 
            },
            "& .MuiInputBase-root": {
              fontSize: "0.75rem",
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default ExcelView;