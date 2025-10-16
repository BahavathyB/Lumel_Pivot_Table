import React, { type JSX } from "react";
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
type AggregationType = "sum" | "avg" | "count" | "max" | "min";

interface ValueField {
  field: string;
  aggregation: AggregationType;
}

interface NestedRowData {
  key: string;
  value: string;
  children: NestedRowData[];
  data: CSVRow[];
  level: number;
}

interface NestedColumnData {
  key: string;
  value: string;
  children: NestedColumnData[];
  level: number;
  colSpan: number;
  rowSpan: number;
}

interface FlatRowData {
  keys: string[];
  values: string[];
  data: CSVRow[];
  key: string;
  level: number;
  isSubtotal?: boolean;
  subtotalLevel?: number;
}

interface FinalColumn {
  key: string;
  colKey: string;
  valueField: ValueField;
  label: string;
}

interface RowSpanInfo {
  rowIndex: number;
  rowSpan: number;
  value: string;
}

interface PivotTableViewProps {
  rows: string[];
  columns: string[];
  values: ValueField[];
  paginatedFlatRowData: FlatRowData[];
  flatRowData: FlatRowData[];
  rowSpanMap: Map<number, Map<number, RowSpanInfo>>;
  pivotData: Record<string, Record<string, Record<string, string>>>;
  finalColumns: FinalColumn[];
  buildNestedColumns: NestedColumnData[];
  leafColumnKeys: string[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PivotTableView: React.FC<PivotTableViewProps> = ({
  rows,
  columns,
  values,
  paginatedFlatRowData,
  flatRowData,
  rowSpanMap,
  pivotData,
  finalColumns,
  buildNestedColumns,
  leafColumnKeys,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const renderPivotTableRows = (): JSX.Element[] =>
    paginatedFlatRowData.map((rowData, rowIndex) => {
      const isSubtotalRow = rowData.isSubtotal === true;

      return (
        <TableRow
          key={rowData.key}
          sx={{
            backgroundColor: isSubtotalRow ? "#e0e0e0" : "inherit",
          }}
        >
          {rows.map((_, levelIndex) => {
            if (isSubtotalRow) {
              if (levelIndex === 0) {
                return (
                  <TableCell
                    key={`${rowData.key}-subtotal`}
                    colSpan={rows.length}
                    sx={{
                      borderRight: "1px solid #aeadadff",
                      borderBottom: "1px solid #aeadadff",
                      fontWeight: "bold",
                      minWidth: 150,
                      verticalAlign: "middle",
                      textAlign: "left",
                      paddingLeft: 2,
                      backgroundColor: "#e0e0e0",
                    }}
                  >
                    Total {rowData.values[0]}
                  </TableCell>
                );
              }
              return null;
            }

            const levelMap = rowSpanMap.get(levelIndex);
            const spanInfo = levelMap?.get(rowIndex);

            if (!spanInfo) {
              return null;
            }

            return (
              <TableCell
                key={`${rowData.key}-lvl-${levelIndex}`}
                rowSpan={spanInfo.rowSpan}
                sx={{
                  borderRight: "1px solid #aeadadff",
                  borderBottom: "1px solid #aeadadff",
                  fontWeight: "bold",
                  minWidth: 150,
                  maxWidth: 150,
                  width: 150,
                  verticalAlign: "middle",
                  textAlign: "center",
                  backgroundColor: "white",
                }}
              >
                {spanInfo.value}
              </TableCell>
            );
          })}

          {(columns.length > 0 || values.length > 0) && (
            <>
              {columns.length > 0 &&
                finalColumns.map(({ key, colKey, valueField }) => {
                  const aggKey = `${valueField.field}_${valueField.aggregation}`;
                  const val = pivotData[rowData.key]?.[colKey]?.[aggKey] || "";

                  return (
                    <TableCell
                      key={key}
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        borderRight: "1px solid #aeadadff",
                        borderBottom: "1px solid #aeadadff",
                        backgroundColor: isSubtotalRow ? "#e0e0e0" : "inherit",
                        minWidth: 120,
                        maxWidth: 120,
                        width: 120,
                      }}
                    >
                      {val}
                    </TableCell>
                  );
                })}
            </>
          )}
        </TableRow>
      );
    });

  const renderPivotTableHeaders = () => {
    if (rows.length > 0 && columns.length === 0 && values.length === 0) {
      return (
        <TableRow>
          {rows.map((fieldName, idx) => (
            <TableCell
              key={`row-header-${idx}`}
              sx={{
                color: "white",
                fontWeight: "bold",
                backgroundColor: "primary.main",
                borderRight:
                  idx === rows.length - 1
                    ? "2px solid rgba(255,255,255,0.5)"
                    : "1px solid rgba(255,255,255,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.4)",
                textAlign: "center",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
                minWidth: 150,
                maxWidth: 150,
                width: 150,
                position: "sticky",
                left: idx * 150,
                top: 0,
                zIndex: 200 - idx,
              }}
            >
              {fieldName}
            </TableCell>
          ))}
        </TableRow>
      );
    }

    if (rows.length > 0 && columns.length === 0 && values.length > 0) {
      return (
        <TableRow>
          {rows.map((fieldName, idx) => (
            <TableCell
              key={`row-header-${idx}`}
              rowSpan={2} 
              sx={{
                color: "white",
                fontWeight: "bold",
                backgroundColor: "primary.main",
                borderRight:
                  idx === rows.length - 1
                    ? "2px solid rgba(255,255,255,0.5)"
                    : "1px solid rgba(255,255,255,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.4)",
                textAlign: "center",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
                minWidth: 150,
                maxWidth: 150,
                width: 150,
                position: "sticky",
                left: idx * 150,
                top: 0,
                zIndex: 200 - idx,
              }}
            >
              {fieldName}
            </TableCell>
          ))}
          {values.map((valueField, idx) => (
            <TableCell
              key={`value-header-${idx}`}
              sx={{
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
                borderLeft: "1px solid rgba(255,255,255,0.3)",
                borderRight: "1px solid rgba(255,255,255,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.4)",
                backgroundColor: "primary.dark",
                whiteSpace: "nowrap",
                minWidth: 120,
                maxWidth: 120,
                width: 120,
                position: "sticky",
                top: 0,
                zIndex: 90,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <span>
                  {valueField.aggregation}({valueField.field})
                </span>
              </Box>
            </TableCell>
          ))}
        </TableRow>
      );
    }

    if (columns.length === 0 && values.length === 0) return null;

    const collectByLevel = (
      nodes: NestedColumnData[],
      level: number,
      out: NestedColumnData[][]
    ) => {
      if (!out[level]) out[level] = [];
      nodes.forEach((n) => {
        out[level] ??= [];
        out[level].push(n);

        if (n.children.length) {
          collectByLevel(n.children, level + 1, out);
        }
      });
    };

    const levels: NestedColumnData[][] = [];
    if (columns.length > 0) collectByLevel(buildNestedColumns, 0, levels);

    const totalHeaderRows =
      (columns.length > 0 ? columns.length : 0) + (values.length > 0 ? 1 : 0);

    const headerRowHeight = 57;

    return (
      <>
        <TableRow>
          {rows.map((fieldName, idx) => (
            <TableCell
              key={`row-header-${idx}`}
              rowSpan={totalHeaderRows}
              sx={{
                color: "white",
                fontWeight: "bold",
                backgroundColor: "primary.main",
                borderRight:
                  idx === rows.length - 1
                    ? "2px solid rgba(255,255,255,0.5)"
                    : "1px solid rgba(255,255,255,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.4)",
                textAlign: "center",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
                minWidth: 150,
                maxWidth: 150,
                width: 150,
              }}
            >
              {fieldName}
            </TableCell>
          ))}

          {levels.length > 0 ? (
            levels[0]?.map((node) => (
              <TableCell
                key={node.key}
                align="center"
                colSpan={node.colSpan}
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  borderLeft: "1px solid rgba(255,255,255,0.3)",
                  borderRight: "1px solid rgba(255,255,255,0.3)",
                  borderBottom: "1px solid rgba(255,255,255,0.4)",
                  backgroundColor: "primary.main",
                  whiteSpace: "nowrap",
                  minWidth: 120,
                  maxWidth: 120,
                  width: 120,
                  position: "sticky",
                  top: 0,
                  zIndex: 90,
                }}
              >
                {node.value}
              </TableCell>
            ))
          ) : values.length > 0 ? (
            <TableCell
              colSpan={values.length}
              sx={{
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
                borderLeft: "1px solid rgba(255,255,255,0.3)",
                borderRight: "1px solid rgba(255,255,255,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.4)",
                backgroundColor: "primary.main",
                whiteSpace: "nowrap",
                minWidth: 120,
                position: "sticky",
                top: 0,
                zIndex: 90,
              }}
            >
              Values
            </TableCell>
          ) : null}
        </TableRow>

        {levels.slice(1).map((lvlNodes, levelIndex) => (
          <TableRow key={`col-level-${levelIndex + 1}`}>
            {lvlNodes.map((node) => (
              <TableCell
                key={node.key}
                align="center"
                colSpan={node.colSpan}
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  borderLeft: "1px solid rgba(255,255,255,0.3)",
                  borderRight: "1px solid rgba(255,255,255,0.3)",
                  borderBottom: "1px solid rgba(255,255,255,0.4)",
                  backgroundColor: "primary.light",
                  whiteSpace: "nowrap",
                  minWidth: 120,
                  maxWidth: 120,
                  width: 120,
                  position: "sticky",
                  top: (levelIndex + 1) * headerRowHeight,
                  zIndex: 89 - levelIndex,
                }}
              >
                {node.value}
              </TableCell>
            ))}
          </TableRow>
        ))}

        {values.length > 0 && (
          <TableRow key="aggregation-row">
            {levels.length > 0
              ? 
                leafColumnKeys.map((colKey) => (
                  <React.Fragment key={colKey}>
                    {values.map((valueField, idx) => (
                      <TableCell
                        key={`${colKey}-${valueField.field}-${idx}`}
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderLeft: "1px solid rgba(255,255,255,0.3)",
                          borderRight:
                            idx === values.length - 1
                              ? "1px solid rgba(255,255,255,0.3)"
                              : "none",
                          borderBottom: "1px solid rgba(255,255,255,0.4)",
                          backgroundColor: "primary.dark",
                          whiteSpace: "nowrap",
                          minWidth: 120,
                          maxWidth: 120,
                          width: 120,
                          position: "sticky",
                          top: levels.length * headerRowHeight,
                          zIndex: 85,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <span>
                            {valueField.aggregation.toUpperCase()} ({valueField.field})
                          </span>
                        </Box>
                      </TableCell>
                    ))}
                  </React.Fragment>
                ))
              :
                values.map((valueField, idx) => (
                  <TableCell
                    key={`value-${valueField.field}-${idx}`}
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                      borderLeft: "1px solid rgba(255,255,255,0.3)",
                      borderRight: "1px solid rgba(255,255,255,0.3)",
                      borderBottom: "1px solid rgba(255,255,255,0.4)",
                      backgroundColor: "primary.dark",
                      whiteSpace: "nowrap",
                      minWidth: 120,
                      maxWidth: 120,
                      width: 120,
                      position: "sticky",
                      top: 0,
                      zIndex: 85,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                      }}
                    >
                      <span>
                        {valueField.aggregation}({valueField.field})
                      </span>
                    </Box>
                  </TableCell>
                ))}
          </TableRow>
        )}
      </>
    );
  };

  return (
    <Paper sx={{ p: 2, overflow: "auto" }}>
      <TableContainer 
        sx={{ 
          maxHeight: 600, 
          maxWidth: "100%",
          position: "relative",
          overflow: "auto",
          "& .MuiTable-root": {
            tableLayout: "fixed",
          },
        }}
      >
        <Table 
          stickyHeader
          sx={{
            position: "relative",
            tableLayout: "fixed",
            minWidth: "100%",
          }}
        >
          <TableHead>{renderPivotTableHeaders()}</TableHead>
          <TableBody>{renderPivotTableRows()}</TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={flatRowData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{
          borderTop: "1px solid #e0e0e0",
          justifyContent: "flex-start",
          "& .MuiTablePagination-toolbar": {
            justifyContent: "flex-start",
          },
        }}
      />
    </Paper>
  );
};

export default PivotTableView;