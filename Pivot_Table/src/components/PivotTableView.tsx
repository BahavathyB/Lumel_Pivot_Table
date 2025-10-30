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

import type { PivotTableViewProps } from "../types/PivotTableView.types";
import { PivotTableViewService } from "../services/pivotTableViewService";

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
  //grand total data
  const grandTotalData = PivotTableViewService.calculateGrandTotal(
    flatRowData,
    finalColumns,
    pivotData
  );

  const renderGrandTotalRow = (stickyTop: number) => {
    if (PivotTableViewService.shouldShowGrandTotal(rows, values)) return null;

    return (
      <TableRow className="grand-total-row" style={{ top: `${stickyTop}px` }}>
        <TableCell
          colSpan={rows.length || 1}
          className="grand-total-label-cell"
        >
          Grand Total
        </TableCell>
        {finalColumns.map(({ key }) => (
          <TableCell
            key={`grand-total-${key}`}
            className="grand-total-value-cell"
          >
            {grandTotalData[key] || ""}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  // Renders main data body (rows + values + subtotals)
  const renderPivotTableRows = (): JSX.Element[] => {
    // Case 1: Only values
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      const allData = flatRowData.flatMap((rowData) => rowData.data);
      return [
        <TableRow key="total-row" className="total-row">
          {values.map((valueField) => (
            <TableCell
              key={`${valueField.field}-${valueField.aggregation}`}
              className="total-value-cell"
            >
              {PivotTableViewService.calculateAggregation(allData, valueField)}
            </TableCell>
          ))}
        </TableRow>,
      ];
    }

    // Case 2: Full pivot view with pagination + subtotals
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
              if (levelIndex < subtotalLevel) {
                const spanInfo = rowSpanMap.get(levelIndex)?.get(rowIndex);
                if (!spanInfo || spanInfo.rowIndex !== rowIndex) return null;
                return (
                  <TableCell
                    key={`${rowData.key}-lvl-${levelIndex}`}
                    rowSpan={spanInfo.rowSpan}
                    className="subtotal-parent-cell"
                  >
                    {spanInfo.value}
                  </TableCell>
                );
              } else if (levelIndex === subtotalLevel) return null;
              else if (levelIndex === subtotalLevel + 1) {
                return (
                  <TableCell
                    key={`${rowData.key}-subtotal-merged`}
                    colSpan={rows.length - (subtotalLevel + 1)}
                    className="subtotal-merged-cell"
                  >
                    Total {rowData.values[subtotalLevel]}
                  </TableCell>
                );
              }
              return null;
            }

            const spanInfo = rowSpanMap.get(levelIndex)?.get(rowIndex);
            if (!spanInfo || spanInfo.rowIndex !== rowIndex) return null;

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

  // Renders all column + row headers (hierarchical)
  const renderPivotTableHeaders = () => {
    const totalHeaderRows = PivotTableViewService.calculateTotalHeaderRows(
      columns,
      values
    );

    // Case 1: Only row fields
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

    // Case 2: Row fields + value columns, no column hierarchy
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
          {renderGrandTotalRow(
            PivotTableViewService.calculateGrandTotalTop(totalHeaderRows)
          )}
        </>
      );
    }

    // Case 3: Fully hierarchical columns
    if (columns.length === 0 && values.length === 0) return null;

    const levels = PivotTableViewService.buildColumnLevels(buildNestedColumns);

    return (
      <>
        {/* Top-level column headers */}
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
          {levels[0]?.map((node) => (
            <TableCell
              key={node.key}
              colSpan={node.colSpan}
              className="column-header-cell column-header-level-0"
            >
              {node.value}
            </TableCell>
          ))}
        </TableRow>

        {/* Additional nested column levels */}
        {levels.slice(1).map((lvlNodes, levelIndex) => (
          <TableRow key={`col-level-${levelIndex + 1}`} className="header-row">
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

        {/* Aggregation headers (sum, avg, etc.) */}
        {values.length > 0 && (
          <TableRow key="aggregation-row" className="header-row">
            {PivotTableViewService.generateValueColumns(
              leafColumnKeys,
              values
            ).map(({ key, valueField }) => (
              <TableCell
                key={key}
                className="aggregation-header-cell"
                style={{ top: `${30 * levels.length}px` }}
              >
                {valueField.aggregation.toUpperCase()} ({valueField.field})
              </TableCell>
            ))}
          </TableRow>
        )}

        {/* Grand total row under headers */}
        {renderGrandTotalRow(
          PivotTableViewService.calculateGrandTotalTop(totalHeaderRows)
        )}
      </>
    );
  };

  return (
    <Box className="pivot-table-container">
      <TableContainer component={Paper} className="table-container">
        <Table className="table" stickyHeader aria-label="Pivot Table View">
          <TableHead className="table-head">
            {renderPivotTableHeaders()}
          </TableHead>
          <TableBody className="table-body">{renderPivotTableRows()}</TableBody>
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
