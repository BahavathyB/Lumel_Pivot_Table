import React, { useState, useMemo, useEffect, type DragEvent } from "react";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";

import ExcelView from "./ExcelView";
import FieldZones from "./FieldZones";
import PivotTableView from "./PivotTableView";
import { PivotTableService } from "../services/pivotTableService";
import type {
  CSVRow,
  AggregationType,
  ValueField,
} from "../types/PivotTable.types"

import "../styles/PivotTable.css";

const PivotTable: React.FC = () => {
  const csvData = useSelector((state: RootState) => state.csv.data) as CSVRow[];

  const allColumns = useMemo(
    () => (csvData.length > 0 ? Object.keys(csvData[0] ?? {}) : []),
    [csvData]
  );

  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [values, setValues] = useState<ValueField[]>([]);
  const [draggedField, setDraggedField] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Build nested rows hierarchy based on selected row fields
  const buildNestedRows = useMemo(
    () => PivotTableService.buildNestedRows(csvData, rows),
    [csvData, rows]
  );

  // Flatten nested structure into a renderable table format
  const flatRowData = useMemo(
    () =>
      PivotTableService.buildFlatRowData(
        buildNestedRows,
        rows,
        csvData,
        columns,
        values
      ),
    [buildNestedRows, rows, csvData, columns, values]
  );

  // Filter out subtotal rows for pagination
  const nonSubtotalRows = useMemo(
    () => flatRowData.filter((row) => !row.isSubtotal),
    [flatRowData]
  );

  const paginatedFlatRowData = useMemo(
    () =>
      PivotTableService.getPaginatedFlatRowData(
        flatRowData,
        nonSubtotalRows,
        page,
        rowsPerPage
      ),
    [flatRowData, nonSubtotalRows, page, rowsPerPage]
  );

  // Build column hierarchy based on selected column fields
  const buildNestedColumns = useMemo(
    () => PivotTableService.buildNestedColumns(csvData, columns, values.length),
    [csvData, columns, values.length]
  );

  // Get final leaf-level columns used for rendering
  const leafColumnKeys = useMemo(
    () => PivotTableService.getLeafColumnKeys(buildNestedColumns),
    [buildNestedColumns]
  );

  // Combine columns and value fields to create final visible columns
  const finalColumns = useMemo(
    () =>
      PivotTableService.buildFinalColumns(
        leafColumnKeys,
        values,
        rows,
        columns
      ),
    [leafColumnKeys, values, rows, columns]
  );

  // Compute row spans for merged cells in grouped rows
  const rowSpanMap = useMemo(
    () => PivotTableService.calculateRowSpanMap(paginatedFlatRowData, rows),
    [paginatedFlatRowData, rows]
  );

  // Calculate pivot aggregation data
  const pivotData = useMemo(
    () =>
      PivotTableService.calculatePivotData(
        csvData,
        rows,
        columns,
        flatRowData,
        leafColumnKeys,
        values
      ),
    [csvData, rows, columns, flatRowData, leafColumnKeys, values]
  );

  // -------------------- SIDE EFFECTS (useEffect) --------------------
  // available fields
  useEffect(() => {
    if (allColumns.length > 0) setAvailableFields(allColumns);
  }, [allColumns]);

  // Reset pagination page
  useEffect(() => {
    setPage(0);
  }, [csvData, rows, columns, values]);

  // -------------------- EVENT HANDLERS --------------------
  const handleChangePage = (event: unknown, newPage: number) =>
    setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDragStart = (field: string) => setDraggedField(field);
  const handleDragOver = (e: DragEvent) => e.preventDefault();

  // Handles dropping a field into a specific zone
  const handleDrop = (zone: "rows" | "columns" | "values", field?: string) => {
    const fieldToMove = field || draggedField;
    if (!fieldToMove) return;

    const newState = PivotTableService.handleFieldDrop(zone, fieldToMove, {
      availableFields,
      rows,
      columns,
      values,
    });

    setAvailableFields(newState.availableFields);
    setRows(newState.rows);
    setColumns(newState.columns);
    setValues(newState.values);
    setDraggedField(null);
  };

  // Removes a field from a given zone
  const removeFieldFromZone = (
    zone: "rows" | "columns" | "values",
    field: string
  ) => {
    const newState = PivotTableService.removeFieldFromZone(zone, field, {
      availableFields,
      rows,
      columns,
      values,
    });

    setAvailableFields(newState.availableFields);
    setRows(newState.rows);
    setColumns(newState.columns);
    setValues(newState.values);
  };

  // Clears one or all zones
  const clearZone = (zone: "rows" | "columns" | "values" | "all") => {
    const newState = PivotTableService.clearZone(zone, {
      availableFields,
      rows,
      columns,
      values,
    });

    setAvailableFields(newState.availableFields);
    setRows(newState.rows);
    setColumns(newState.columns);
    setValues(newState.values);
  };

  // Updates aggregation type (sum, avg, count, etc.)
  const updateValueAggregation = (
    field: string,
    aggregation: AggregationType
  ) => {
    setValues((prev) =>
      PivotTableService.updateValueAggregation(field, aggregation, prev)
    );
  };

  // Moves a field between zones (e.g., row → column)
  const handleFieldMove = (
    fromZone: "rows" | "columns" | "values",
    toZone: "rows" | "columns" | "values",
    field: string
  ) => {
    removeFieldFromZone(fromZone, field);
    handleDrop(toZone, field);
  };

  // -------------------- RENDER LOGIC --------------------
  // Check if user has configured any fields
  const hasConfiguredFields =
    rows.length > 0 || columns.length > 0 || values.length > 0;

  return (
    <Box className="pivot-table-main-container">
      <Box className="pivot-table-content-area">
        {!hasConfiguredFields ? (
          <ExcelView
            csvData={csvData}
            allColumns={allColumns}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        ) : (
          <PivotTableView
            rows={rows}
            columns={columns}
            values={values}
            paginatedFlatRowData={paginatedFlatRowData}
            flatRowData={flatRowData}
            rowSpanMap={rowSpanMap}
            pivotData={pivotData}
            finalColumns={finalColumns}
            buildNestedColumns={buildNestedColumns}
            leafColumnKeys={leafColumnKeys}
            page={page}
            rowsPerPage={rowsPerPage}
            totalNonSubtotalRows={nonSubtotalRows.length}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Box>

      <Box className="pivot-table-field-zones-area">
        <FieldZones
          availableFields={availableFields}
          rows={rows}
          columns={columns}
          values={values}
          draggedField={draggedField}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onRemoveField={removeFieldFromZone}
          onClearZone={clearZone}
          onUpdateValueAggregation={updateValueAggregation}
          onFieldMove={handleFieldMove}
        />
      </Box>
    </Box>
  );
};

export default PivotTable;
