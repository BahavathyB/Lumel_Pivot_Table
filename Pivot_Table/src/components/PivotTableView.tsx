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
  subtotalLevel?: number | undefined;
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
  // -------------------- TABLE STYLING CONSTANTS --------------------
  const cellHeight = 30;
  const cellHeightPx = "20px";
  const fontSize = "0.7rem";
  const padding = "2px 6px";
  const greyBorder = "1px solid #e0e0e0";

  // -------------------- AGGREGATION CALCULATION --------------------
  const calculateAggregation = (
    data: CSVRow[],
    valueField: ValueField
  ): string => {
    if (data.length === 0) return "";

    const fieldValues = data
      .map((row) => row[valueField.field])
      .filter((val) => val !== null && val !== undefined && val !== "");

    if (fieldValues.length === 0) return "";

    switch (valueField.aggregation) {
      case "sum":
        const sumValues = fieldValues
          .map((val) => {
            const num = parseFloat(String(val));
            return isNaN(num) ? 0 : num;
          })
          .reduce((sum, val) => sum + val, 0);
        return sumValues === 0 ? "" : sumValues.toString();

      case "avg":
        const avgValues = fieldValues
          .map((val) => {
            const num = parseFloat(String(val));
            return isNaN(num) ? null : num;
          })
          .filter((v): v is number => v !== null);

        if (avgValues.length === 0) return "";
        const avg =
          avgValues.reduce((sum, val) => sum + val, 0) / avgValues.length;
        return avg.toFixed(2);

      case "count":
        return fieldValues.length.toString();

      case "max":
        const maxValues = fieldValues
          .map((val) => {
            const num = parseFloat(String(val));
            return isNaN(num) ? null : num;
          })
          .filter((v): v is number => v !== null);

        if (maxValues.length === 0) return "";
        return Math.max(...maxValues).toString();

      case "min":
        const minValues = fieldValues
          .map((val) => {
            const num = parseFloat(String(val));
            return isNaN(num) ? null : num;
          })
          .filter((v): v is number => v !== null);

        if (minValues.length === 0) return "";
        return Math.min(...minValues).toString();

      default:
        return "";
    }
  };

  // -------------------- GRAND TOTAL CALCULATION --------------------
  const calculateGrandTotal = () => {
    const grandTotalData: Record<string, string> = {};

    finalColumns.forEach(({ key, colKey, valueField }) => {
      const aggKey = `${valueField.field}_${valueField.aggregation}`;
      const columnValues: number[] = [];

      flatRowData.forEach((rowData) => {
        if (!rowData.isSubtotal) {
          const val = pivotData[rowData.key]?.[colKey]?.[aggKey];
          if (val && val !== "" && val !== "-") {
            const num = parseFloat(val);
            if (!isNaN(num)) {
              columnValues.push(num);
            }
          }
        }
      });

      if (columnValues.length > 0) {
        grandTotalData[key] = columnValues
          .reduce((sum, val) => sum + val, 0)
          .toString();
      } else {
        grandTotalData[key] = "";
      }
    });

    return grandTotalData;
  };

  const grandTotalData = calculateGrandTotal();

  // -------------------- GRAND TOTAL ROW RENDER --------------------
  const renderGrandTotalRow = (stickyTop: number) => {
    if (rows.length === 0 || values.length === 0) {
      return null;
    }

    return (
      <TableRow
        sx={{
          position: "sticky",
          top: `${stickyTop}px`,
          zIndex: 88,
          backgroundColor: "#f5f5f5",
        }}
      >
        <TableCell
          colSpan={rows.length > 0 ? rows.length : 1}
          sx={{
            fontWeight: "bold",
            fontSize,
            height: cellHeightPx,
            padding,
            verticalAlign: "middle",
            textAlign: "center",
            backgroundColor: "#d4ecf1ff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            borderLeft: greyBorder,
            borderBottom: greyBorder,
          }}
        >
          Grand Total
        </TableCell>

        {finalColumns.map(({ key }) => {
          const val = grandTotalData[key] || "";

          return (
            <TableCell
              key={`grand-total-${key}`}
              align="center"
              sx={{
                fontWeight: "bold",
                backgroundColor: "#d4ecf1ff",
                fontSize,
                height: cellHeightPx,
                padding,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                borderLeft: greyBorder,
                borderBottom: greyBorder,
              }}
            >
              {val}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  // -------------------- PIVOT TABLE ROWS RENDER --------------------
  const renderPivotTableRows = (): JSX.Element[] => {
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      const totalRowData: Record<string, string> = {};
      const allData = flatRowData.flatMap((rowData) => rowData.data);

      values.forEach((valueField) => {
        totalRowData[`${valueField.field}_${valueField.aggregation}`] =
          calculateAggregation(allData, valueField);
      });

      return [
        <TableRow key="total-row">
          {values.map((valueField) => {
            const aggKey = `${valueField.field}_${valueField.aggregation}`;
            const val = totalRowData[aggKey] || "";

            return (
              <TableCell
                key={`${valueField.field}-${valueField.aggregation}`}
                align="center"
                sx={{
                  fontWeight: "normal",
                  backgroundColor: "#f5f5f5",
                  fontSize,
                  height: cellHeightPx,
                  padding,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderLeft: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {val}
              </TableCell>
            );
          })}
        </TableRow>,
      ];
    }

    return paginatedFlatRowData.map((rowData, rowIndex) => {
      const isSubtotalRow = rowData.isSubtotal === true;
      const subtotalLevel = rowData.subtotalLevel ?? 0;

      return (
        <TableRow
          key={rowData.key}
          sx={{
            backgroundColor: isSubtotalRow ? "#f5f5f5" : "inherit",
          }}
        >
          {rows.map((_, levelIndex) => {
            if (isSubtotalRow) {
              if (levelIndex < subtotalLevel) {
                const levelMap = rowSpanMap.get(levelIndex);
                const spanInfo = levelMap?.get(rowIndex);

                if (!spanInfo || spanInfo.rowIndex !== rowIndex) {
                  return null;
                }

                return (
                  <TableCell
                    key={`${rowData.key}-lvl-${levelIndex}`}
                    rowSpan={spanInfo.rowSpan}
                    sx={{
                      fontWeight: "normal",
                      fontSize,
                      height: cellHeightPx,
                      padding,
                      verticalAlign: "middle",
                      textAlign: "center",
                      backgroundColor: "white",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      borderLeft: greyBorder,
                      borderBottom: greyBorder,
                    }}
                  >
                    {spanInfo.value}
                  </TableCell>
                );
              } else if (levelIndex === subtotalLevel) {
                const colSpanCount = rows.length - subtotalLevel;
                return (
                  <TableCell
                    key={`${rowData.key}-subtotal-merged`}
                    colSpan={colSpanCount}
                    sx={{
                      fontWeight: "bold",
                      fontSize,
                      height: cellHeightPx,
                      padding,
                      verticalAlign: "middle",
                      textAlign: "left",
                      paddingLeft: `${(subtotalLevel + 1) * 16}px`,
                      backgroundColor: "#f5f5f5",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      borderLeft: greyBorder,
                      borderBottom: greyBorder,
                    }}
                  >
                    Total {rowData.values[subtotalLevel]}
                  </TableCell>
                );
              } else {
                return null;
              }
            }

            const levelMap = rowSpanMap.get(levelIndex);
            const spanInfo = levelMap?.get(rowIndex);

            if (!spanInfo || spanInfo.rowIndex !== rowIndex) {
              return null;
            }

            return (
              <TableCell
                key={`${rowData.key}-lvl-${levelIndex}`}
                rowSpan={spanInfo.rowSpan}
                sx={{
                  fontWeight: "normal",
                  fontSize,
                  height: cellHeightPx,
                  padding,
                  verticalAlign: "middle",
                  textAlign: "center",
                  backgroundColor: "white",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderLeft: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {spanInfo.value}
              </TableCell>
            );
          })}

          {finalColumns.map(({ key, colKey, valueField }) => {
            const aggKey = `${valueField.field}_${valueField.aggregation}`;
            const val = pivotData[rowData.key]?.[colKey]?.[aggKey] || "";

            return (
              <TableCell
                key={key}
                align="center"
                sx={{
                  fontWeight: isSubtotalRow ? "bold" : "normal",
                  backgroundColor: isSubtotalRow ? "#f5f5f5" : "inherit",
                  fontSize,
                  height: cellHeightPx,
                  padding,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderLeft: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {val}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  };

  // -------------------- PIVOT TABLE HEADERS RENDER --------------------
  const renderPivotTableHeaders = () => {
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

    if (rows.length > 0 && columns.length === 0 && values.length === 0) {
      return (
        <>
          <TableRow>
            {rows.map((fieldName, idx) => (
              <TableCell
                key={`row-header-${idx}`}
                sx={{
                  color: "black",
                  fontWeight: "bold",
                  backgroundColor: "rgba(204, 203, 203, 1)",
                  textAlign: "center",
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                  fontSize,
                  height: cellHeightPx,
                  padding,
                  minWidth: "auto",
                  maxWidth: "auto",
                  width: "auto",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  position: "sticky",
                  top: 0,
                  zIndex: 90,
                  borderLeft: greyBorder,
                  borderTop: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {fieldName}
              </TableCell>
            ))}
          </TableRow>
        </>
      );
    }

    if (rows.length > 0 && columns.length === 0 && values.length > 0) {
      return (
        <>
          <TableRow>
            {rows.map((fieldName, idx) => (
              <TableCell
                key={`row-header-${idx}`}
                rowSpan={totalHeaderRows}
                sx={{
                  color: "black",
                  fontWeight: "bold",
                  backgroundColor: "rgba(204, 203, 203, 1)",
                  textAlign: "center",
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                  fontSize,
                  height: cellHeightPx,
                  padding,
                  minWidth: "auto",
                  maxWidth: "auto",
                  width: "auto",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  position: "sticky",
                  top: 0,
                  zIndex: 90,
                  borderLeft: greyBorder,
                  borderTop: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {fieldName}
              </TableCell>
            ))}
            {values.map((valueField, idx) => (
              <TableCell
                key={`value-header-${idx}`}
                sx={{
                  color: "black",
                  fontWeight: "bold",
                  textAlign: "center",
                  backgroundColor: "rgba(204, 203, 203, 1)",
                  whiteSpace: "nowrap",
                  fontSize: "0.6rem",
                  height: cellHeightPx,
                  padding,
                  minWidth: "auto",
                  maxWidth: "auto",
                  width: "auto",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  position: "sticky",
                  top: 0,
                  zIndex: 90,
                  borderLeft: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {valueField.aggregation.toUpperCase()} ({valueField.field})
              </TableCell>
            ))}
          </TableRow>
          {renderGrandTotalRow(cellHeight)}
        </>
      );
    }

    if (columns.length === 0 && values.length === 0) return null;

    return (
      <>
        <TableRow>
          {rows.map((fieldName, idx) => (
            <TableCell
              key={`row-header-${idx}`}
              rowSpan={totalHeaderRows}
              sx={{
                color: "black",
                fontWeight: "bold",
                backgroundColor: "rgba(204, 203, 203, 1)",
                textAlign: "center",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
                fontSize,
                height: `${cellHeight * totalHeaderRows}px`,
                padding,
                minWidth: "auto",
                maxWidth: "auto",
                width: "auto",
                overflow: "hidden",
                textOverflow: "ellipsis",
                position: "sticky",
                top: 0,
                zIndex: 90,
                borderLeft: greyBorder,
                borderTop: greyBorder,
                borderBottom: greyBorder,
              }}
            >
              {fieldName}
            </TableCell>
          ))}

          {levels.length > 0 && (
            levels[0]?.map((node) => (
              <TableCell
                key={node.key}
                align="center"
                colSpan={node.colSpan}
                sx={{
                  color: "black",
                  fontWeight: "bold",
                  textAlign: "center",
                  backgroundColor: "rgba(204, 203, 203, 1)",
                  whiteSpace: "nowrap",
                  fontSize,
                  height: cellHeightPx,
                  minHeight: cellHeightPx,
                  maxHeight: cellHeightPx,
                  padding,
                  minWidth: "auto",
                  maxWidth: "auto",
                  width: "auto",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  position: "sticky",
                  top: 0,
                  zIndex: 90,
                  boxSizing: "border-box",
                  borderLeft: greyBorder,
                  borderTop: greyBorder,
                  borderBottom: greyBorder,
                }}
              >
                {node.value}
              </TableCell>
            ))
          ) }
        </TableRow>

        {levels.slice(1).map((lvlNodes, levelIndex) => (
          <TableRow key={`col-level-${levelIndex + 1}`}>
            {lvlNodes.map((node) => (
              <TableCell
                key={node.key}
                align="center"
                colSpan={node.colSpan}
                sx={{
                  color: "black",
                  fontWeight: "bold",
                  textAlign: "center",
                  backgroundColor: "rgba(204, 203, 203, 1)",
                  whiteSpace: "nowrap",
                  fontSize,
                  height: cellHeightPx,
                  minHeight: cellHeightPx,
                  maxHeight: cellHeightPx,
                  padding,
                  minWidth: "auto",
                  maxWidth: "auto",
                  width: "auto",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  position: "sticky",
                  top: cellHeight * (levelIndex + 1),
                  zIndex: 89 - levelIndex,
                  boxSizing: "border-box",
                  borderLeft: greyBorder,
                  borderBottom: greyBorder,
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
              ? leafColumnKeys.flatMap((colKey) =>
                  values.map((valueField) => (
                    <TableCell
                      key={`${colKey}-${valueField.field}`}
                      sx={{
                        color: "black",
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "rgba(204, 203, 203, 1)",
                        whiteSpace: "nowrap",
                        fontSize: "0.6rem",
                        height: cellHeightPx,
                        minHeight: cellHeightPx,
                        maxHeight: cellHeightPx,
                        padding,
                        minWidth: "auto",
                        maxWidth: "auto",
                        width: "auto",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        position: "sticky",
                        top: cellHeight * levels.length,
                        zIndex: 85,
                        boxSizing: "border-box",
                        borderLeft: greyBorder,
                        borderBottom: greyBorder,
                      }}
                    >
                      {valueField.aggregation.toUpperCase()} ({valueField.field}
                      )
                    </TableCell>
                  ))
                )
              : values.map((valueField) => (
                  <TableCell
                    key={`value-${valueField.field}`}
                    sx={{
                      color: "black",
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "rgba(204, 203, 203, 1)",
                      whiteSpace: "nowrap",
                      fontSize: "0.6rem",
                      height: cellHeightPx,
                      minHeight: cellHeightPx,
                      maxHeight: cellHeightPx,
                      padding,
                      minWidth: "auto",
                      maxWidth: "auto",
                      width: "auto",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      position: "sticky",
                      top: 0,
                      zIndex: 85,
                      boxSizing: "border-box",
                      borderLeft: greyBorder,
                      borderBottom: greyBorder,
                    }}
                  >
                    {valueField.aggregation.toUpperCase()} ({valueField.field})
                  </TableCell>
                ))}
          </TableRow>
        )}
        {renderGrandTotalRow(cellHeight * totalHeaderRows)}
      </>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          maxHeight: "calc(100% - 52px)",
          position: "relative",
          overflow: "auto",
          "& .MuiTable-root": {
            tableLayout: "auto",
            borderCollapse: "separate",
            borderSpacing: 0,
          },
          "& .MuiTableHead-root": {
            position: "sticky",
            top: 0,
            zIndex: 100,
          },
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
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
            background: "#f1f1f1",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "#c1c1c1 #f1f1f1",
        }}
      >
        <Table
          sx={{
            position: "relative",
            tableLayout: "auto",
            minWidth: "100%",
            borderSpacing: 0,
          }}
        >
          <TableHead
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              display: "table-header-group",
            }}
          >
            {renderPivotTableHeaders()}
          </TableHead>
          <TableBody>{renderPivotTableRows()}</TableBody>
        </Table>
      </TableContainer>

      <Paper
        elevation={4}
        sx={{
          border: "1px solid #e0e0e0",
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
          count={flatRowData.length}
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

export default PivotTableView;