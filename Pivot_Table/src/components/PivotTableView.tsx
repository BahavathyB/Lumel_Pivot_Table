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
import "../styles/PivotTableView.css";

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
  totalNonSubtotalRows: number;
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
  totalNonSubtotalRows,
  onPageChange,
  onRowsPerPageChange,
}) => {
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
      <TableRow className="grand-total-row" style={{ top: `${stickyTop}px` }}>
        <TableCell
          colSpan={rows.length > 0 ? rows.length : 1}
          className="grand-total-label-cell"
        >
          Grand Total
        </TableCell>

        {finalColumns.map(({ key }) => {
          const val = grandTotalData[key] || "";

          return (
            <TableCell
              key={`grand-total-${key}`}
              className="grand-total-value-cell"
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
    console.log("flat row data: " + flatRowData);

    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      const totalRowData: Record<string, string> = {};
      const allData = flatRowData.flatMap((rowData) => rowData.data);

      values.forEach((valueField) => {
        totalRowData[`${valueField.field}_${valueField.aggregation}`] =
          calculateAggregation(allData, valueField);
      });

      return [
        <TableRow key="total-row" className="total-row">
          {values.map((valueField) => {
            const aggKey = `${valueField.field}_${valueField.aggregation}`;
            const val = totalRowData[aggKey] || "";

            return (
              <TableCell
                key={`${valueField.field}-${valueField.aggregation}`}
                className="total-value-cell"
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
          className={`pivot-table-row ${isSubtotalRow ? "subtotal-row" : ""}`}
        >
          {rows.map((_, levelIndex) => {
            if (isSubtotalRow) {
              // subtotal rows as child level (subtotalLevel + 1)
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
                    className="subtotal-parent-cell"
                  >
                    {spanInfo.value}
                  </TableCell>
                );
              } else if (levelIndex === subtotalLevel) {
                return null;
              } else if (levelIndex === subtotalLevel + 1) {
                const colSpanCount = rows.length - (subtotalLevel + 1);
                return (
                  <TableCell
                    key={`${rowData.key}-subtotal-merged`}
                    colSpan={colSpanCount}
                    className="subtotal-merged-cell"
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
                className="regular-row-cell"
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
                className={`pivot-value-cell ${
                  isSubtotalRow ? "subtotal-value-cell" : ""
                }`}
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
        <TableRow className="header-row">
          {rows.map((fieldName, idx) => (
            <TableCell key={`row-header-${idx}`} className="row-header-cell">
              {fieldName}
            </TableCell>
          ))}
        </TableRow>
      );
    }

    if (rows.length > 0 && columns.length === 0 && values.length > 0) {
      return (
        <>
          <TableRow className="header-row">
            {rows.map((fieldName, idx) => (
              <TableCell
                key={`row-header-${idx}`}
                rowSpan={totalHeaderRows}
                className="row-header-cell row-header-with-values"
              >
                {fieldName}
              </TableCell>
            ))}
            {values.map((valueField, idx) => (
              <TableCell
                key={`value-header-${idx}`}
                className="value-header-cell"
              >
                {valueField.aggregation.toUpperCase()} ({valueField.field})
              </TableCell>
            ))}
          </TableRow>
          {renderGrandTotalRow(30 * totalHeaderRows)}
        </>
      );
    }

    if (columns.length === 0 && values.length === 0) return null;

    return (
      <>
        <TableRow className="header-row">
          {rows.map((fieldName, idx) => (
            <TableCell
              key={`row-header-${idx}`}
              rowSpan={totalHeaderRows}
              className="row-header-cell row-header-with-columns"
              style={{ height: `${30 * totalHeaderRows}px` }}
            >
              {fieldName}
            </TableCell>
          ))}

          {levels.length > 0 &&
            levels[0]?.map((node) => (
              <TableCell
                key={node.key}
                colSpan={node.colSpan}
                className="column-header-cell column-header-level-0"
              >
                {node.value}
              </TableCell>
            ))}
        </TableRow>

        {levels.slice(1).map((lvlNodes, levelIndex) => (
          <TableRow
            key={`col-level-${levelIndex + 1}`}
            className="header-row"
          >
            {lvlNodes.map((node) => (
              <TableCell
                key={node.key}
                colSpan={node.colSpan}
                className={`column-header-cell column-header-level-${
                  levelIndex + 1
                }`}
                style={{ top: `${30 * (levelIndex + 1)}px` }}
              >
                {node.value}
              </TableCell>
            ))}
          </TableRow>
        ))}

        {values.length > 0 && (
          <TableRow key="aggregation-row" className="header-row">
            {levels.length > 0
              ? leafColumnKeys.flatMap((colKey) =>
                  values.map((valueField) => (
                    <TableCell
                      key={`${colKey}-${valueField.field}`}
                      className="aggregation-header-cell"
                      style={{ top: `${30 * levels.length}px` }}
                    >
                      {valueField.aggregation.toUpperCase()} ({valueField.field})
                    </TableCell>
                  ))
                )
              : values.map((valueField) => (
                  <TableCell
                    key={`value-${valueField.field}`}
                    className="aggregation-header-cell"
                  >
                    {valueField.aggregation.toUpperCase()} ({valueField.field})
                  </TableCell>
                ))}
          </TableRow>
        )}
        {renderGrandTotalRow(30 * totalHeaderRows)}
      </>
    );
  };

  return (
    <Box className="pivot-table-container">
      <TableContainer component={Paper} className="table-container">
        <Table className="table">
          <TableHead className="table-head">
            {renderPivotTableHeaders()}
          </TableHead>
          <TableBody>{renderPivotTableRows()}</TableBody>
        </Table>
      </TableContainer>

      <Paper elevation={4} className="pagination-container">
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={totalNonSubtotalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className="table-pagination"
        />
      </Paper>
    </Box>
  );
};

export default PivotTableView;