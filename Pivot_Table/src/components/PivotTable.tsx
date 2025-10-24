import React, { useState, useMemo, useEffect, type DragEvent } from "react";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";
import _ from "lodash";

import ExcelView from "./ExcelView";
import FieldZones, { type ValueField } from "./FieldZones";
import PivotTableView from "./PivotTableView";

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

  useEffect(() => {
    if (allColumns.length > 0) setAvailableFields(allColumns);
  }, [allColumns]);

  useEffect(() => {
    setPage(0);
  }, [csvData, rows, columns, values]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // -------------------- DRAG AND DROP HANDLERS --------------------
  const handleDragStart = (field: string) => setDraggedField(field);
  const handleDragOver = (e: DragEvent) => e.preventDefault();

  const handleDrop = (zone: "rows" | "columns" | "values", field?: string) => {
    const fieldToMove = field || draggedField;
    if (!fieldToMove) return;

    setAvailableFields((prev) => prev.filter((f) => f !== fieldToMove));
    setRows((prev) => prev.filter((f) => f !== fieldToMove));
    setColumns((prev) => prev.filter((f) => f !== fieldToMove));
    setValues((prev) => prev.filter((v) => v.field !== fieldToMove));

    if (zone === "rows") setRows((prev) => [...prev, fieldToMove]);
    if (zone === "columns") setColumns((prev) => [...prev, fieldToMove]);
    if (zone === "values")
      setValues((prev) => [
        ...prev,
        { field: fieldToMove, aggregation: "sum" },
      ]);

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
    if (zone === "values")
      setValues((prev) => prev.filter((v) => v.field !== field));
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
        ...values.map((v) => v.field),
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

  const handleFieldMove = (
    fromZone: "rows" | "columns" | "values",
    toZone: "rows" | "columns" | "values",
    field: string
  ) => {
    removeFieldFromZone(fromZone, field);
    handleDrop(toZone, field);
  };

  // -------------------- ROW HIERARCHY --------------------
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

  // -------------------- FLATTEN ROW DATA FOR DISPLAY --------------------
  const flatRowData = useMemo((): FlatRowData[] => {
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      return [
        {
          keys: ["total"],
          values: ["Total"],
          data: csvData,
          key: "total",
          level: 0,
        },
      ];
    }

    if (columns.length > 0 && rows.length === 0 && values.length > 0) {
      return [
        {
          keys: ["total"],
          values: ["Total"],
          data: csvData,
          key: "total",
          level: 0,
        },
      ];
    }

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

          result.push({
            keys: newKeys,
            values: newValues,
            data: node.data,
            key: `${newKeys.join("|")}-subtotal`,
            level: node.level,
            isSubtotal: true,
            subtotalLevel: node.level,
          });
        }
      });
    };

    traverse(buildNestedRows);
    return result;
  }, [buildNestedRows, rows, csvData, columns, values]);

  // -------------------- PAGINATION: Only count non-subtotal rows --------------------
  const nonSubtotalRows = useMemo(() => {
    return flatRowData.filter((row) => !row.isSubtotal);
  }, [flatRowData]);

  const paginatedFlatRowData = useMemo(() => {
    // Get the non-subtotal rows for this page
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageNonSubtotalRows = nonSubtotalRows.slice(startIndex, endIndex);

    if (pageNonSubtotalRows.length === 0) return [];

    // Get the keys of the first and last non-subtotal rows on this page
    const firstKey = pageNonSubtotalRows[0]?.key;
    const lastKey = pageNonSubtotalRows[pageNonSubtotalRows.length - 1]?.key;

    // Find the indices in the full flatRowData
    const firstIndex = flatRowData.findIndex((row) => row.key === firstKey);
    const lastIndex = flatRowData.findIndex((row) => row.key === lastKey);

    if (firstIndex === -1 || lastIndex === -1) return [];

    // Include all rows (including subtotals) between first and last non-subtotal row
    // Also include any subtotals that come after the last row if they belong to the same group
    let endIndexInclusive = lastIndex;
    
    // Look ahead for subtotals that belong to the current page's data
    for (let i = lastIndex + 1; i < flatRowData.length; i++) {
      const row = flatRowData[i];
      if (row?.isSubtotal) {
        // Check if this subtotal's parent path matches any row on the current page
        const subtotalParentPath = row.keys.slice(0, (row.subtotalLevel ?? 0) + 1).join("|");
        const belongsToPage = pageNonSubtotalRows.some((pageRow) => {
          const pageRowPath = pageRow.keys.slice(0, (row.subtotalLevel ?? 0) + 1).join("|");
          return pageRowPath === subtotalParentPath;
        });
        
        if (belongsToPage) {
          endIndexInclusive = i;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return flatRowData.slice(firstIndex, endIndexInclusive + 1);
  }, [flatRowData, nonSubtotalRows, page, rowsPerPage]);

  // -------------------- COLUMN HIERARCHY --------------------
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

  // -------------------- FINAL COLUMNS CONFIGURATION --------------------
  const finalColumns: FinalColumn[] = useMemo(() => {
    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      return values.map((valueField) => ({
        key: `${valueField.field}_${valueField.aggregation}`,
        colKey: "total",
        valueField,
        label: `${valueField.aggregation}(${valueField.field})`,
      }));
    }

    if (rows.length > 0 && columns.length === 0 && values.length > 0) {
      return values.map((valueField) => ({
        key: `total-${valueField.field}_${valueField.aggregation}`,
        colKey: "total",
        valueField,
        label: `${valueField.aggregation}(${valueField.field})`,
      }));
    }

    if (rows.length === 0 && columns.length > 0 && values.length === 0) {
      return leafColumnKeys.map((key) => ({
        key,
        colKey: key,
        valueField: { field: key, aggregation: "count" },
        label: key,
      }));
    }

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

  // -------------------- ROW SPANS CALCULATION FOR GROUPING --------------------
  const rowSpanMap = useMemo((): Map<number, Map<number, RowSpanInfo>> => {
    const map = new Map<number, Map<number, RowSpanInfo>>();
    if (paginatedFlatRowData.length === 0) return map;
    if (rows.length === 0) return map;

    rows.forEach((_, levelIndex) => {
      const levelMap = new Map<number, RowSpanInfo>();
      let i = 0;

      while (i < paginatedFlatRowData.length) {
        const currentRow = paginatedFlatRowData[i];

        if (
          currentRow?.isSubtotal &&
          (currentRow.subtotalLevel ?? 0) <= levelIndex
        ) {
          i++;
          continue;
        }

        const currentValue = currentRow?.values[levelIndex];
        let startIndex = i;
        let spanCount = 1;
        let j = i + 1;

        while (j < paginatedFlatRowData.length) {
          const nextRow = paginatedFlatRowData[j];

          if (
            nextRow?.isSubtotal &&
            (nextRow.subtotalLevel ?? 0) <= levelIndex
          ) {
            break;
          }

          const nextValue = nextRow?.values[levelIndex];

          let parentMatch = true;
          for (let k = 0; k < levelIndex; k++) {
            if (nextRow?.values[k] !== currentRow?.values[k]) {
              parentMatch = false;
              break;
            }
          }

          if (parentMatch && nextValue === currentValue) {
            spanCount++;
            j++;
          } else {
            break;
          }
        }

        if (
          j < paginatedFlatRowData.length &&
          paginatedFlatRowData[j]?.isSubtotal === true &&
          (paginatedFlatRowData[j]?.subtotalLevel ?? 0) === levelIndex
        ) {
          spanCount++;
        }

        if (spanCount > 0) {
          levelMap.set(startIndex, {
            rowIndex: startIndex,
            rowSpan: spanCount,
            value: currentValue ?? "",
          });
        }

        i = j;

        if (
          i < paginatedFlatRowData.length &&
          paginatedFlatRowData[i]?.isSubtotal === true &&
          (paginatedFlatRowData[i]?.subtotalLevel ?? 0) === levelIndex
        ) {
          i++;
        }
      }

      map.set(levelIndex, levelMap);
    });

    return map;
  }, [paginatedFlatRowData, rows]);

  // -------------------- AGGREGATION CALCULATIONS --------------------
  const calculateAggregations = (cellData: CSVRow[]) => {
    if (!cellData.length || !values.length) return {};
    const aggregations: Record<string, string> = {};

    values.forEach(({ field, aggregation }) => {
      let result = "";
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
            result = _.max(numericValues)?.toString() || "";
            break;
          case "min":
            result = _.min(numericValues)?.toString() || "";
            break;
        }
      } else if (aggregation === "count") {
        result = cellData.filter((r) => r[field] != null).length.toString();
      }

      aggregations[`${field}_${aggregation}`] = result;
    });

    return aggregations;
  };

  // -------------------- PIVOT DATA CALCULATION --------------------
  const pivotData = useMemo(() => {
    const data: Record<string, Record<string, Record<string, string>>> = {};

    if (rows.length === 0 && columns.length === 0 && values.length > 0) {
      data["total"] = { total: {} };

      values.forEach((valueField) => {
        const matchingRows = csvData;
        if (matchingRows.length > 0) {
          data["total"]!["total"] = calculateAggregations(matchingRows);
        }
      });
      return data;
    }

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

      flatRowData.forEach((rowData) => {
        if (rowData.isSubtotal) {
          const subtotalLevel = rowData.subtotalLevel ?? 0;
          const parentKeyPrefix = rowData.keys
            .slice(0, subtotalLevel + 1)
            .join("|");

          const directChildren = flatRowData.filter((childRow) => {
            if (childRow.key === rowData.key) return false;

            const childPrefix = childRow.keys
              .slice(0, subtotalLevel + 1)
              .join("|");
            if (childPrefix !== parentKeyPrefix) return false;

            if (childRow.isSubtotal) {
              return childRow.subtotalLevel === subtotalLevel + 1;
            }

            return childRow.keys.length === subtotalLevel + 2;
          });

          if (!data[rowData.key]) data[rowData.key] = {};
          data[rowData.key]!["total"] = {};

          values.forEach((valueField) => {
            const aggKey = `${valueField.field}_${valueField.aggregation}`;

            const childValues = directChildren
              .map((childRow) => {
                const val = data[childRow.key]?.["total"]?.[aggKey];
                if (!val || val === "" || val === "-") return null;
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
              })
              .filter((v): v is number => v !== null);

            if (childValues.length > 0) {
              data[rowData.key]!["total"]![aggKey] =
                _.sum(childValues).toString();
            } else {
              data[rowData.key]!["total"]![aggKey] = "";
            }
          });
        }
      });

      return data;
    }

    if (columns.length > 0 && rows.length === 0 && values.length > 0) {
      data["total"] = {};

      leafColumnKeys.forEach((colKey) => {
        if (!data["total"]![colKey]) data["total"]![colKey] = {};

        const matchingRows = csvData.filter((row) => {
          return columns.every(
            (field, i) =>
              String(row[field] ?? "") === (colKey.split("|")[i] || "")
          );
        });

        if (matchingRows.length > 0) {
          data["total"]![colKey] = calculateAggregations(matchingRows);
        }
      });

      return data;
    }

    if (rows.length === 0 && columns.length > 0 && values.length === 0) {
      return {};
    }

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

    if (columns.length > 0) {
      flatRowData.forEach((rowData) => {
        if (rowData.isSubtotal) {
          const subtotalLevel = rowData.subtotalLevel ?? 0;
          const parentKeyPrefix = rowData.keys
            .slice(0, subtotalLevel + 1)
            .join("|");

          const directChildren = flatRowData.filter((childRow) => {
            if (childRow.key === rowData.key) return false;

            const childPrefix = childRow.keys
              .slice(0, subtotalLevel + 1)
              .join("|");
            if (childPrefix !== parentKeyPrefix) return false;

            if (childRow.isSubtotal) {
              return childRow.subtotalLevel === subtotalLevel + 1;
            }

            return childRow.keys.length === subtotalLevel + 2;
          });

          leafColumnKeys.forEach((colKey) => {
            if (!data[rowData.key]![colKey]) data[rowData.key]![colKey] = {};

            values.forEach((valueField) => {
              const aggKey = `${valueField.field}_${valueField.aggregation}`;

              const childValues = directChildren
                .map((childRow) => {
                  const val = data[childRow.key]?.[colKey]?.[aggKey];
                  if (!val || val === "" || val === "-") return null;
                  const num = parseFloat(val);
                  return isNaN(num) ? null : num;
                })
                .filter((v): v is number => v !== null);

              if (childValues.length > 0) {
                data[rowData.key]![colKey]![aggKey] =
                  _.sum(childValues).toString();
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

  const hasConfiguredFields =
    rows.length > 0 || columns.length > 0 || values.length > 0;
  const showExcelFormat = !hasConfiguredFields;
  const showPivotTable = hasConfiguredFields;

  return (
    <Box
      sx={{
        display: "flex",
        height: "95%",
        gap: 2,
        pt: 2,
        pb: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: "80%", height: "100%", mb: 0, overflow: "auto" }}>
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
            totalNonSubtotalRows={nonSubtotalRows.length}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        ) : null}
      </Box>

      <Box sx={{ width: "20%", height: "100%", overflow: "hidden" }}>
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