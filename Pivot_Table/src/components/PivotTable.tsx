import React, {
  useState,
  useMemo,
  useEffect,
  type DragEvent,
} from "react";
import {
  Box,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";
import _ from "lodash";

// Import the new modules
import ExcelView from "./ExcelView";
import FieldZones, { type ValueField } from "./FieldZones";
import PivotTableView from "./PivotTableView";

// -------------------- TYPES --------------------
type CSVRow = Record<string, string | number | null | undefined>;
type AggregationType = "sum" | "avg" | "count" | "max" | "min";

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

// -------------------- PIVOT TABLE --------------------
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

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    if (allColumns.length > 0) setAvailableFields(allColumns);
  }, [allColumns]);

  // Reset to first page when data changes
  useEffect(() => {
    setPage(0);
  }, [csvData, rows, columns, values]);

  // -------------------- PAGINATION HANDLERS --------------------
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // -------------------- DRAG/DROP --------------------
  const handleDragStart = (field: string) => setDraggedField(field);
  const handleDragOver = (e: DragEvent) => e.preventDefault();

  const handleDrop = (zone: "rows" | "columns" | "values", field?: string) => {
    const fieldToMove = field || draggedField;
    if (!fieldToMove) return;

    // Remove from current zones
    setAvailableFields((prev) => prev.filter((f) => f !== fieldToMove));
    setRows((prev) => prev.filter((f) => f !== fieldToMove));
    setColumns((prev) => prev.filter((f) => f !== fieldToMove));
    setValues((prev) => prev.filter((v) => v.field !== fieldToMove));

    // Add to target zone
    if (zone === "rows") setRows((prev) => [...prev, fieldToMove]);
    if (zone === "columns") setColumns((prev) => [...prev, fieldToMove]);
    if (zone === "values")
      setValues((prev) => [...prev, { field: fieldToMove, aggregation: "sum" }]);

    setDraggedField(null);
  };

  const removeFieldFromZone = (
    zone: "rows" | "columns" | "values",
    field: string
  ) => {
    setAvailableFields((prev) => [...prev, field]);

    if (zone === "rows") setRows((prev) => prev.filter((f) => f !== field));
    if (zone === "columns")
      setColumns((prev) => prev.filter((f) => f !== field));
    if (zone === "values") {
      setValues((prev) => prev.filter((v) => v.field !== field));
    }
  };

  const clearZone = (zone: "rows" | "columns" | "values" | "all") => {
    if (zone === "rows") {
      setAvailableFields((prev) => [...prev, ...rows]);
      setRows([]);
    } else if (zone === "columns") {
      setAvailableFields((prev) => [...prev, ...columns]);
      setColumns([]);
    } else if (zone == "values") {
      const removedFields = values.map((v) => v.field);
      setAvailableFields((prev) => [...prev, ...removedFields]);
      setValues([]);
    } else {

      const removedFields = [
        ...rows,
        ...columns,
        ...values.map((v) => v.field)
      ];
      setAvailableFields((prev) => [...prev, ...removedFields]);
      setRows([]);
      setColumns([]);
      setValues([]);
    }
  };

  const updateValueAggregation = (
    field: string,
    aggregation: AggregationType
  ) =>
    setValues((prev) =>
      prev.map((v) => (v.field === field ? { ...v, aggregation } : v))
    );

  const handleFieldMove = (fromZone: "rows" | "columns" | "values", toZone: "rows" | "columns" | "values", field: string) => {
    removeFieldFromZone(fromZone, field);
    handleDrop(toZone, field);
  };

  // -------------------- HIERARCHY --------------------
  const buildNestedRows = useMemo(() => {
    if (!rows.length || !csvData.length) return [];

    const build = (
      data: CSVRow[],
      level: number,
      parentKey = ""
    ): NestedRowData[] => {
      if (level >= rows.length) return [];
      const field = rows[level];
      const grouped = data.reduce((acc, row) => {
        const value = String(row[field ?? ""] ?? "N/A");
        const key = parentKey ? `${parentKey}|${value}` : value;
        (acc[key] ||= []).push(row);
        return acc;
      }, {} as Record<string, CSVRow[]>);

      return Object.entries(grouped).map(([key, group]) => ({
        key,
        value: key.split("|").pop() || "",
        children: build(group, level + 1, key),
        data: group,
        level,
      }));
    };

    return build(csvData, 0);
  }, [csvData, rows]);

  const flatRowData = useMemo((): FlatRowData[] => {
    // Case: Only values configured (no rows, no columns) - create single row
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      return [{
        keys: ["total"],
        values: ["Total"],
        data: csvData,
        key: "total",
        level: 0,
      }];
    }

    // Case: Only columns and values configured (no rows) - create single row
    if (columns.length > 0 && rows.length === 0 && values.length > 0) {
      return [{
        keys: ["total"],
        values: ["Total"],
        data: csvData,
        key: "total",
        level: 0,
      }];
    }

    // Case: Only columns configured (no rows, no values) - return empty array (no data rows needed)
    if (rows.length === 0 && columns.length > 0 && values.length === 0) {
      return [];
    }

    if (!rows.length || !buildNestedRows.length) return [];

    const result: FlatRowData[] = [];
    const traverse = (
      nodes: NestedRowData[],
      pathKeys: string[] = [],
      pathValues: string[] = []
    ) => {
      nodes.forEach((node) => {
        const newKeys = [...pathKeys, node.key];
        const newValues = [...pathValues, node.value];
        if (node.children.length === 0) {
          result.push({
            keys: newKeys,
            values: newValues,
            data: node.data,
            key: newKeys.join("|"),
            level: node.level,
          });
        } else {
          traverse(node.children, newKeys, newValues);
          // Add subtotal row after all children for top-level parents only
          if (node.level === 0) {
            result.push({
              keys: newKeys,
              values: newValues,
              data: node.data,
              key: `${newKeys.join("|")}-subtotal`,
              level: node.level,
              isSubtotal: true,
              subtotalLevel: 0,
            });
          }
        }
      });
    };
    traverse(buildNestedRows);
    return result;
  }, [buildNestedRows, rows, csvData, columns, values]);

  // Apply pagination to flatRowData
  const paginatedFlatRowData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return flatRowData.slice(startIndex, endIndex);
  }, [flatRowData, page, rowsPerPage]);

  const buildNestedColumns = useMemo(() => {
    if (!columns.length || !csvData.length) return [];

    const build = (
      data: CSVRow[],
      level: number,
      parentKey = ""
    ): NestedColumnData[] => {
      if (level >= columns.length) return [];
      const field = columns[level];
      const grouped = data.reduce((acc, row) => {
        const value = String(row[field ?? ""] ?? "N/A");
        const key = parentKey ? `${parentKey}|${value}` : value;
        (acc[key] ||= []).push(row);
        return acc;
      }, {} as Record<string, CSVRow[]>);

      return Object.entries(grouped).map(([key, group]) => {
        const children = build(group, level + 1, key);
        const colSpan = children.length
          ? children.reduce((sum, c) => sum + c.colSpan, 0)
          : values.length > 0
          ? values.length
          : 1;
        return {
          key,
          value: key.split("|").pop() || "",
          children,
          level,
          colSpan,
          rowSpan: 1,
        };
      });
    };

    return build(csvData, 0);
  }, [csvData, columns, values.length]);

  const leafColumnKeys = useMemo(() => {
    const collect = (nodes: NestedColumnData[]): string[] =>
      nodes.flatMap((n) =>
        n.children.length === 0 ? [n.key] : collect(n.children)
      );
    return collect(buildNestedColumns);
  }, [buildNestedColumns]);

  // -------------------- FINAL COLUMNS LOGIC --------------------
  const finalColumns: FinalColumn[] = useMemo(() => {
    // Case 1: Only values configured (no rows, no columns)
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      return values.map((valueField) => ({
        key: `${valueField.field}_${valueField.aggregation}`,
        colKey: "total",
        valueField,
        label: `${valueField.aggregation}(${valueField.field})`,
      }));
    }

    // Case 2: Only rows and values configured (no columns)
    if (rows.length > 0 && columns.length === 0 && values.length > 0) {
      return values.map((valueField) => ({
        key: `total-${valueField.field}_${valueField.aggregation}`,
        colKey: "total",
        valueField,
        label: `${valueField.aggregation}(${valueField.field})`,
      }));
    }

    // Case 3: Only columns configured (no rows, no values)
    if (rows.length === 0 && columns.length > 0 && values.length === 0) {
      return leafColumnKeys.map((key) => ({
        key,
        colKey: key,
        valueField: { field: key, aggregation: "count" },
        label: key,
      }));
    }

    // Case 4: Only columns and values configured (no rows)
    if (columns.length > 0 && rows.length === 0 && values.length > 0) {
      return leafColumnKeys.flatMap((colKey) =>
        values.map((valueField) => ({
          key: `${colKey}|${valueField.field}_${valueField.aggregation}`,
          colKey,
          valueField,
          label: `${valueField.aggregation}(${valueField.field})`,
        }))
      );
    }

    // Case 5: Full configuration (rows, columns, values)
    if (leafColumnKeys.length === 0 && values.length === 0) return [];
    if (values.length === 0)
      return leafColumnKeys.map((key) => ({
        key,
        colKey: key,
        valueField: { field: key, aggregation: "count" },
        label: key,
      }));
    
    return leafColumnKeys.flatMap((colKey) =>
      values.map((valueField) => ({
        key: `${colKey}|${valueField.field}_${valueField.aggregation}`,
        colKey,
        valueField,
        label: `${valueField.aggregation}(${valueField.field})`,
      }))
    );
  }, [leafColumnKeys, values, rows, columns]);

  // -------------------- CALCULATE ROWSPAN FOR ROW GROUPING --------------------
  const rowSpanMap = useMemo((): Map<number, Map<number, RowSpanInfo>> => {
    const map = new Map<number, Map<number, RowSpanInfo>>();

    if (paginatedFlatRowData.length === 0) return map;

    // Skip rowspan calculation for cases without rows
    if (rows.length === 0) return map;

    // For each level (column) in row grouping
    rows.forEach((_, levelIndex) => {
      const levelMap = new Map<number, RowSpanInfo>();
      let currentValue = paginatedFlatRowData[0]?.values[levelIndex];
      let startIndex = 0;
      let spanCount = 1;

      for (let i = 1; i < paginatedFlatRowData.length; i++) {
        const value = paginatedFlatRowData[i]?.values[levelIndex];

        // Skip subtotal rows when calculating rowspan
        if (paginatedFlatRowData[i]?.isSubtotal) {
          // Save the span info before the subtotal
          if (spanCount > 0) {
            levelMap.set(startIndex, {
              rowIndex: startIndex,
              rowSpan: spanCount,
              value: currentValue ?? "",
            });
          }
          spanCount = 0;
          continue;
        }

        // Check if all parent levels match (for nested grouping)
        let parentMatch = true;
        for (let j = 0; j < levelIndex; j++) {
          if (paginatedFlatRowData[i]?.values[j] !== paginatedFlatRowData[i - 1]?.values[j]) {
            parentMatch = false;
            break;
          }
        }

        if (
          parentMatch &&
          value === currentValue &&
          !paginatedFlatRowData[i - 1]?.isSubtotal
        ) {
          spanCount++;
        } else {
          // Save the span info for the starting row
          if (spanCount > 0) {
            levelMap.set(startIndex, {
              rowIndex: startIndex,
              rowSpan: spanCount,
              value: currentValue ?? "",
            });
          }
          // Start new group
          currentValue = value;
          startIndex = i;
          spanCount = 1;
        }
      }

      // Don't forget the last group
      if (spanCount > 0) {
        levelMap.set(startIndex, {
          rowIndex: startIndex,
          rowSpan: spanCount,
          value: currentValue ?? "",
        });
      }

      map.set(levelIndex, levelMap);
    });

    return map;
  }, [paginatedFlatRowData, rows]);

  // -------------------- AGGREGATION --------------------
  const calculateAggregations = (cellData: CSVRow[]) => {
    if (!cellData.length || !values.length) return {};
    const aggregations: Record<string, string> = {};

    values.forEach(({ field, aggregation }) => {
      let result = "-";
      const numericValues = cellData
        .map((row) => {
          const val = row[field];
          const num =
            typeof val === "number"
              ? val
              : typeof val === "string"
              ? parseFloat(val)
              : NaN;
          return isNaN(num) ? null : num;
        })
        .filter((v): v is number => v !== null);

      if (numericValues.length > 0) {
        switch (aggregation) {
          case "sum":
            result = _.sum(numericValues).toString();
            break;
          case "avg":
            result = _.mean(numericValues).toFixed(2);
            break;
          case "count":
            result = numericValues.length.toString();
            break;
          case "max":
            result = _.max(numericValues)?.toString() || "-";
            break;
          case "min":
            result = _.min(numericValues)?.toString() || "-";
            break;
        }
      } else if (aggregation === "count") {
        result = cellData.filter((r) => r[field] != null).length.toString();
      }

      aggregations[`${field}_${aggregation}`] = result;
    });

    return aggregations;
  };

  // -------------------- SUBTOTAL CALCULATIONS --------------------
  const calculateSubtotalValue = (
    parentRowData: FlatRowData,
    colKey: string,
    valueField: ValueField,
    childValues: string[]
  ): string => {
    const { aggregation } = valueField;

    // Filter out non-numeric values and convert to numbers
    const numericValues = childValues
      .map((val) => {
        if (val === "-" || val === "") return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      })
      .filter((v): v is number => v !== null);

    if (numericValues.length === 0) return "-";

    switch (aggregation) {
      case "sum":
        // Sum of individual sums
        return _.sum(numericValues).toString();

      case "avg":
        // Sum of individual averages
        return _.sum(numericValues).toFixed(2);

      case "count":
        // Sum of individual counts
        return _.sum(numericValues).toString();

      case "max":
        // Sum of individual maximums
        return _.sum(numericValues).toString();

      case "min":
        // Sum of individual minimums
        return _.sum(numericValues).toString();

      default:
        return "-";
    }
  };

  // -------------------- PIVOT DATA LOGIC --------------------
  const pivotData = useMemo(() => {
    const data: Record<string, Record<string, Record<string, string>>> = {};

    // Case 1: Only values configured (no rows, no columns)
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      // Create a single "total" row
      data["total"] = { total: {} };
      
      values.forEach((valueField) => {
        const aggKey = `${valueField.field}_${valueField.aggregation}`;
        
        // Calculate aggregation across all data
        const matchingRows = csvData;
        if (matchingRows.length > 0) {
          data["total"]!["total"] = calculateAggregations(matchingRows);
        }
      });
      return data;
    }

    // Case 2: Only rows and values configured (no columns)
    if (rows.length > 0 && columns.length === 0 && values.length > 0) {
      flatRowData.forEach((rowData) => {
        if (!data[rowData.key]) data[rowData.key] = {};

        if (!rowData.isSubtotal) {
          const matchingRows = csvData.filter((row) => {
            return rows.every(
              (field, i) => String(row[field] ?? "") === rowData.values[i]
            );
          });

          if (matchingRows.length > 0) {
            data[rowData.key]!["total"] = calculateAggregations(matchingRows);
          }
        }
      });

      // Calculate subtotals for rows + values case
      flatRowData.forEach((rowData) => {
        if (rowData.isSubtotal) {
          const parentKey = rowData.keys[0];
          const childRows = flatRowData.filter(
            (childRow) => !childRow.isSubtotal && childRow.keys[0] === parentKey
          );

          if (!data[rowData.key]) data[rowData.key] = {};
          data[rowData.key]!["total"] = {};

          values.forEach((valueField) => {
            const aggKey = `${valueField.field}_${valueField.aggregation}`;
            const childValues = childRows
              .map((childRow) => data[childRow.key]?.["total"]?.[aggKey])
              .filter((val): val is string => val !== undefined && val !== "-");

            if (childValues.length > 0) {
              data[rowData.key]!["total"]![aggKey] = calculateSubtotalValue(
                rowData,
                "total",
                valueField,
                childValues
              );
            } else {
              data[rowData.key]!["total"]![aggKey] = "";
            }
          });
        }
      });

      return data;
    }

    // Case 3: Only columns and values configured (no rows)
    if (columns.length > 0 && rows.length === 0 && values.length > 0) {
      // Create a single "total" row
      data["total"] = {};
      
      leafColumnKeys.forEach((colKey) => {
        if (!data["total"]![colKey]) data["total"]![colKey] = {};

        const matchingRows = csvData.filter((row) => {
          return columns.every(
            (field, i) => String(row[field] ?? "") === (colKey.split("|")[i] || "")
          );
        });

        if (matchingRows.length > 0) {
          data["total"]![colKey] = calculateAggregations(matchingRows);
        }
      });

      return data;
    }

    // Case 4: Only columns configured (no rows, no values) - no data needed
    if (rows.length === 0 && columns.length > 0 && values.length === 0) {
      return {};
    }

    // Case 5: Full configuration with rows, columns, and values
    flatRowData.forEach((rowData) => {
      if (!data[rowData.key]) data[rowData.key] = {};

      if (columns.length > 0) {
        leafColumnKeys.forEach((colKey) => {
          if (!data[rowData.key]![colKey]) data[rowData.key]![colKey] = {};

          if (!rowData.isSubtotal) {
            const matchingRows = csvData.filter((row) => {
              const rowMatch = rows.every(
                (field, i) => String(row[field] ?? "") === rowData.values[i]
              );
              const colMatch = columns.every(
                (field, i) =>
                  String(row[field] ?? "") === (colKey.split("|")[i] || "")
              );
              return rowMatch && colMatch;
            });

            if (matchingRows.length > 0) {
              data[rowData.key]![colKey] = calculateAggregations(matchingRows);
            }
          }
        });
      } else {
        if (!data[rowData.key]!["total"]) data[rowData.key]!["total"] = {};

        if (!rowData.isSubtotal) {
          const matchingRows = csvData.filter((row) => {
            return rows.every(
              (field, i) => String(row[field] ?? "") === rowData.values[i]
            );
          });

          if (matchingRows.length > 0) {
            data[rowData.key]!["total"] = calculateAggregations(matchingRows);
          }
        }
      }
    });

    // Calculate subtotals for regular case
    if (columns.length > 0) {
      flatRowData.forEach((rowData) => {
        if (rowData.isSubtotal) {
          const parentKey = rowData.keys[0];
          const childRows = flatRowData.filter(
            (childRow) => !childRow.isSubtotal && childRow.keys[0] === parentKey
          );

          leafColumnKeys.forEach((colKey) => {
            if (!data[rowData.key]![colKey]) data[rowData.key]![colKey] = {};

            values.forEach((valueField) => {
              const aggKey = `${valueField.field}_${valueField.aggregation}`;
              const childValues = childRows
                .map((childRow) => data[childRow.key]?.[colKey]?.[aggKey])
                .filter((val): val is string => val !== undefined && val !== "-");

              if (childValues.length > 0) {
                data[rowData.key]![colKey]![aggKey] = calculateSubtotalValue(
                  rowData,
                  colKey,
                  valueField,
                  childValues
                );
              } else {
                data[rowData.key]![colKey]![aggKey] = "";
              }
            });
          });
        }
      });
    }

    return data;
  }, [csvData, rows, columns, flatRowData, leafColumnKeys, values]);

  // FIXED: Show Excel format only when NO fields are configured
  const hasConfiguredFields = rows.length > 0 || columns.length > 0 || values.length > 0;
  const showExcelFormat = !hasConfiguredFields;

  // FIXED: Show pivot table when we have any field configuration
  const showPivotTable = hasConfiguredFields;

  return (
    <Box sx={{ display: "flex", height: "100%", gap: 2, pt: 3, pb: 3, overflow: "hidden" }}>
      {/* Table Container - 75% width */}
      <Box sx={{ width: "75%", height: "100%", overflow: "auto" }}>
        {showExcelFormat ? (
          <ExcelView
            csvData={csvData}
            allColumns={allColumns}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        ) : showPivotTable ? (
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        ) : null}
      </Box>

      {/* Field Zones Container - 25% width */}
      <Box sx={{ width: "25%", height: "100%", overflow: "hidden" }}>
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