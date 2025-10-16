import React, {
  useState,
  useMemo,
  useEffect,
  type DragEvent,
} from "react";
import {
  Box,
  Typography,
} from "@mui/material";
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

  const slicedData = useMemo(() => csvData.slice(0, 100), [csvData]);
  const allColumns = useMemo(
    () => (slicedData.length > 0 ? Object.keys(slicedData[0] ?? {}) : []),
    [slicedData]
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
  }, [slicedData, rows, columns, values]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDragStart = (field: string) => setDraggedField(field);
  const handleDragOver = (e: DragEvent) => e.preventDefault();

  const handleDrop = (zone: "rows" | "columns" | "values") => {
    if (!draggedField) return;
    const field = draggedField;

    setAvailableFields((prev) => prev.filter((f) => f !== field));
    setRows((prev) => prev.filter((f) => f !== field));
    setColumns((prev) => prev.filter((f) => f !== field));
    setValues((prev) => prev.filter((v) => v.field !== field));

    if (zone === "rows") setRows((prev) => [...prev, field]);
    if (zone === "columns") setColumns((prev) => [...prev, field]);
    if (zone === "values")
      setValues((prev) => [...prev, { field, aggregation: "sum" }]);

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

  const clearZone = (zone: "rows" | "columns" | "values") => {
    if (zone === "rows") {
      setAvailableFields((prev) => [...prev, ...rows]);
      setRows([]);
    } else if (zone === "columns") {
      setAvailableFields((prev) => [...prev, ...columns]);
      setColumns([]);
    } else {
      const removedFields = values.map((v) => v.field);
      setAvailableFields((prev) => [...prev, ...removedFields]);
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

  const buildNestedRows = useMemo(() => {
    if (!rows.length || !slicedData.length) return [];

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

    return build(slicedData, 0);
  }, [slicedData, rows]);

  const flatRowData = useMemo((): FlatRowData[] => {
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
  }, [buildNestedRows, rows]);

  const paginatedFlatRowData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return flatRowData.slice(startIndex, endIndex);
  }, [flatRowData, page, rowsPerPage]);

  const buildNestedColumns = useMemo(() => {
    if (!columns.length || !slicedData.length) return [];

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

    return build(slicedData, 0);
  }, [slicedData, columns, values.length]);

  const leafColumnKeys = useMemo(() => {
    const collect = (nodes: NestedColumnData[]): string[] =>
      nodes.flatMap((n) =>
        n.children.length === 0 ? [n.key] : collect(n.children)
      );
    return collect(buildNestedColumns);
  }, [buildNestedColumns]);

  const finalColumns: FinalColumn[] = useMemo(() => {
    if (rows.length > 0 && columns.length === 0 && values.length === 0) {
      return [];
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

  const rowSpanMap = useMemo((): Map<number, Map<number, RowSpanInfo>> => {
    const map = new Map<number, Map<number, RowSpanInfo>>();

    if (paginatedFlatRowData.length === 0) return map;

    rows.forEach((_, levelIndex) => {
      const levelMap = new Map<number, RowSpanInfo>();
      let currentValue = paginatedFlatRowData[0]?.values[levelIndex];
      let startIndex = 0;
      let spanCount = 1;

      for (let i = 1; i < paginatedFlatRowData.length; i++) {
        const value = paginatedFlatRowData[i]?.values[levelIndex];

        if (paginatedFlatRowData[i]?.isSubtotal) {
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
          if (spanCount > 0) {
            levelMap.set(startIndex, {
              rowIndex: startIndex,
              rowSpan: spanCount,
              value: currentValue ?? "",
            });
          }
          currentValue = value;
          startIndex = i;
          spanCount = 1;
        }
      }

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

  const calculateSubtotalValue = (
    parentRowData: FlatRowData,
    colKey: string,
    valueField: ValueField,
    childValues: string[]
  ): string => {
    const { aggregation } = valueField;

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
        return _.sum(numericValues).toString();

      case "avg":
        return _.sum(numericValues).toFixed(2);

      case "count":
        return _.sum(numericValues).toString();

      case "max":
        return _.sum(numericValues).toString();

      case "min":
        return _.sum(numericValues).toString();

      default:
        return "-";
    }
  };

  const pivotData = useMemo(() => {
    const data: Record<string, Record<string, Record<string, string>>> = {};

    flatRowData.forEach((rowData) => {
      if (!data[rowData.key]) data[rowData.key] = {};

      if (columns.length > 0) {
        leafColumnKeys.forEach((colKey) => {
          if (!data[rowData.key]![colKey]) data[rowData.key]![colKey] = {};

          if (!rowData.isSubtotal) {
            const matchingRows = slicedData.filter((row) => {
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
          const matchingRows = slicedData.filter((row) => {
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
                .filter((val) => val !== undefined && val !== "-");

              if (childValues.length > 0) {
                data[rowData.key]![colKey]![aggKey] = calculateSubtotalValue(
                  rowData,
                  colKey,
                  valueField,
                  childValues.filter((v): v is string => v !== undefined)
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
  }, [slicedData, rows, columns, flatRowData, leafColumnKeys, values]);

  if (!csvData.length) {
    return (
      <Typography
        variant="h6"
        sx={{ mt: 5, textAlign: "center", color: "gray" }}
      >
        No CSV data uploaded yet
      </Typography>
    );
  }

  const hasConfiguredFields =
    rows.length > 0 || columns.length > 0 || values.length > 0;
  const showExcelFormat = !hasConfiguredFields || (values.length > 0 && rows.length === 0 && columns.length === 0);

  const showPivotTable = hasConfiguredFields && !showExcelFormat && rows.length > 0;

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Pivot Table
      </Typography>

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
      />

      {showExcelFormat ? (
        <ExcelView
          slicedData={slicedData}
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
  );
};

export default PivotTable;