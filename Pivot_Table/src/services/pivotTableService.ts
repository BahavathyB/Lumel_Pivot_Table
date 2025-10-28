import _ from "lodash";
import type {
  CSVRow, AggregationType, ValueField, NestedRowData,
  NestedColumnData, FlatRowData, FinalColumn, RowSpanInfo
} from "../types/pivotTableViewTypes";

export class PivotTableService {
  // FIELD MANAGEMENT
  // Moves a field to a specified zone (rows, columns, or values) and updates state
static handleFieldDrop(
  zone: "rows" | "columns" | "values",
  fieldToMove: string,
  currentState: {
    availableFields: string[];
    rows: string[];
    columns: string[];
    values: ValueField[];
  }
) {
  const baseState = {
    availableFields: currentState.availableFields.filter(f => f !== fieldToMove),
    rows: currentState.rows.filter(f => f !== fieldToMove),
    columns: currentState.columns.filter(f => f !== fieldToMove),
    values: currentState.values.filter(v => v.field !== fieldToMove),
  };

  if (zone === "rows") {
    return { ...baseState, rows: [...baseState.rows, fieldToMove] };
  }
  
  if (zone === "columns") {
    return { ...baseState, columns: [...baseState.columns, fieldToMove] };
  }
  
  if (zone === "values") {
    const newValueField: ValueField = { 
      field: fieldToMove, 
      aggregation: "sum" as AggregationType
    };
    return { ...baseState, values: [...baseState.values, newValueField] };
  }
  
  return currentState;
}

  static removeFieldFromZone(
    zone: "rows" | "columns" | "values",
    field: string,
    currentState: { availableFields: string[]; rows: string[]; columns: string[]; values: ValueField[] }
  ) {
    const newAvailableFields = [...currentState.availableFields, field];
    const update = { availableFields: newAvailableFields };
    
    if (zone === "rows") return { ...currentState, ...update, rows: currentState.rows.filter(f => f !== field) };
    if (zone === "columns") return { ...currentState, ...update, columns: currentState.columns.filter(f => f !== field) };
    if (zone === "values") return { ...currentState, ...update, values: currentState.values.filter(v => v.field !== field) };
    return currentState;
  }

  static clearZone(
    zone: "rows" | "columns" | "values" | "all",
    currentState: { availableFields: string[]; rows: string[]; columns: string[]; values: ValueField[] }
  ) {
    if (zone === "all") {
      const removedFields = [...currentState.rows, ...currentState.columns, ...currentState.values.map(v => v.field)];
      return { availableFields: [...currentState.availableFields, ...removedFields], rows: [], columns: [], values: [] };
    }

    const fieldList = zone === "rows" ? currentState.rows : zone === "columns" ? currentState.columns : currentState.values.map(v => v.field);
    return {
      ...currentState,
      availableFields: [...currentState.availableFields, ...fieldList],
      rows: zone === "rows" ? [] : currentState.rows,
      columns: zone === "columns" ? [] : currentState.columns,
      values: zone === "values" ? [] : currentState.values,
    };
  }

  static updateValueAggregation = (field: string, aggregation: AggregationType, values: ValueField[]) =>
    values.map(v => v.field === field ? { ...v, aggregation } : v);


  // ----------------------ROW HIERARCHY-------------------------------
  static buildNestedRows(csvData: CSVRow[], rows: string[]): NestedRowData[] {
    if (!rows.length || !csvData.length) return [];

    const build = (data: CSVRow[], level: number, parentKey = ""): NestedRowData[] => 
      level >= rows.length ? [] : Object.entries(_.groupBy(data, row => String(row[rows[level]!] ?? "N/A"))).map(([value, group]) => {
        const key = parentKey ? `${parentKey}|${value}` : value;
        return { key, value, children: build(group, level + 1, key), data: group, level };
      });

    return build(csvData, 0);
  }

  static buildFlatRowData(
    buildNestedRows: NestedRowData[], rows: string[], csvData: CSVRow[], columns: string[], values: ValueField[]
  ): FlatRowData[] {
    if ((!rows.length && !columns.length && values.length > 0) || (columns.length > 0 && !rows.length && values.length > 0))
      return [{ keys: ["total"], values: ["Total"], data: csvData, key: "total", level: 0 }];
    if (!rows.length || !buildNestedRows.length) return [];

    const result: FlatRowData[] = [];
    const traverse = (nodes: NestedRowData[], pathKeys: string[] = [], pathValues: string[] = []) => 
      nodes.forEach(node => {
        const newKeys = [...pathKeys, node.key], newValues = [...pathValues, node.value];
        if (!node.children.length) {
          result.push({ keys: newKeys, values: newValues, data: node.data, key: newKeys.join("|"), level: node.level });
        } else {
          traverse(node.children, newKeys, newValues);
          result.push({ keys: newKeys, values: newValues, data: node.data, key: `${newKeys.join("|")}-subtotal`, level: node.level, isSubtotal: true, subtotalLevel: node.level });
        }
      });

    traverse(buildNestedRows);
    return result;
  }

  // ------------------------------PAGINATION--------------------------------------------
  static getPaginatedFlatRowData(flatRowData: FlatRowData[], nonSubtotalRows: FlatRowData[], page: number, rowsPerPage: number): FlatRowData[] {
    const startIndex = page * rowsPerPage, endIndex = startIndex + rowsPerPage;
    const pageNonSubtotalRows = nonSubtotalRows.slice(startIndex, endIndex);
    if (!pageNonSubtotalRows.length) return [];

    const firstKey = pageNonSubtotalRows[0]?.key, lastKey = pageNonSubtotalRows[pageNonSubtotalRows.length - 1]?.key;
    const firstIndex = flatRowData.findIndex(row => row.key === firstKey), lastIndex = flatRowData.findIndex(row => row.key === lastKey);
    if (firstIndex === -1 || lastIndex === -1) return [];

    let endIndexInclusive = lastIndex;
    for (let i = lastIndex + 1; i < flatRowData.length; i++) {
      const row = flatRowData[i];
      if (!row?.isSubtotal) break;
      const subtotalParentPath = row.keys.slice(0, (row.subtotalLevel ?? 0) + 1).join("|");
      const belongsToPage = pageNonSubtotalRows.some(pageRow => 
        pageRow.keys.slice(0, (row.subtotalLevel ?? 0) + 1).join("|") === subtotalParentPath
      );
      
      if (belongsToPage) {
        endIndexInclusive = i;
      } else {
        break;
      }
    }

    return flatRowData.slice(firstIndex, endIndexInclusive + 1);
  }

  // ------------------------------COLUMN HIERARCHY----------------------------
  static buildNestedColumns(csvData: CSVRow[], columns: string[], valuesLength: number): NestedColumnData[] {
    if (!columns.length || !csvData.length) return [];

    const build = (data: CSVRow[], level: number, parentKey = ""): NestedColumnData[] => 
      level >= columns.length ? [] : Object.entries(_.groupBy(data, row => String(row[columns[level]!] ?? "N/A"))).map(([value, group]) => {
        const key = parentKey ? `${parentKey}|${value}` : value;
        const children = build(group, level + 1, key);
        const colSpan = children.length ? children.reduce((sum, c) => sum + c.colSpan, 0) : valuesLength || 1;
        return { key, value, children, level, colSpan, rowSpan: 1 };
      });

    return build(csvData, 0);
  }

  static getLeafColumnKeys = (buildNestedColumns: NestedColumnData[]): string[] => {
    const collect = (nodes: NestedColumnData[]): string[] => nodes.flatMap(n => n.children.length ? collect(n.children) : [n.key]);
    return collect(buildNestedColumns);
  };

  // ------------------FINAL COLUMNS-------------------------------
  static buildFinalColumns(leafColumnKeys: string[], values: ValueField[], rows: string[], columns: string[]): FinalColumn[] {
    if (!rows.length && !columns.length && values.length > 0)
      return values.map(v => ({ key: `${v.field}_${v.aggregation}`, colKey: "total", valueField: v, label: `${v.aggregation}(${v.field})` }));
    
    if (rows.length > 0 && !columns.length && values.length > 0)
      return values.map(v => ({ key: `total-${v.field}_${v.aggregation}`, colKey: "total", valueField: v, label: `${v.aggregation}(${v.field})` }));
    
    if (!rows.length && columns.length > 0 && !values.length)
      return leafColumnKeys.map(key => ({ key, colKey: key, valueField: { field: key, aggregation: "count" }, label: key }));
    
    if (columns.length > 0 && !rows.length && values.length > 0)
      return leafColumnKeys.flatMap(colKey => values.map(v => ({ key: `${colKey}|${v.field}_${v.aggregation}`, colKey, valueField: v, label: `${v.aggregation}(${v.field})` })));

    return !values.length 
      ? leafColumnKeys.map(key => ({ key, colKey: key, valueField: { field: key, aggregation: "count" }, label: key }))
      : leafColumnKeys.flatMap(colKey => values.map(v => ({ key: `${colKey}|${v.field}_${v.aggregation}`, colKey, valueField: v, label: `${v.aggregation}(${v.field})` })));
  }

  // --------------------ROW SPANS---------------------------------
  static calculateRowSpanMap(paginatedFlatRowData: FlatRowData[], rows: string[]): Map<number, Map<number, RowSpanInfo>> {
    const map = new Map<number, Map<number, RowSpanInfo>>();
    if (!paginatedFlatRowData.length || !rows.length) return map;

    rows.forEach((_, levelIndex) => {
      const levelMap = new Map<number, RowSpanInfo>();
      let i = 0;

      while (i < paginatedFlatRowData.length) {
        const currentRow = paginatedFlatRowData[i];
        if (currentRow?.isSubtotal && (currentRow.subtotalLevel ?? 0) <= levelIndex) { i++; continue; }

        const currentValue = currentRow?.values[levelIndex];
        let startIndex = i, spanCount = 1, j = i + 1;

        while (j < paginatedFlatRowData.length) {
          const nextRow = paginatedFlatRowData[j];
          if (nextRow?.isSubtotal && (nextRow.subtotalLevel ?? 0) <= levelIndex) break;
          
          const parentMatch = Array.from({ length: levelIndex }, (_, k) => nextRow?.values[k] === currentRow?.values[k]).every(Boolean);
          if (parentMatch && nextRow?.values[levelIndex] === currentValue) { spanCount++; j++; } else break;
        }

        if (paginatedFlatRowData[j]?.isSubtotal && (paginatedFlatRowData[j]?.subtotalLevel ?? 0) === levelIndex) spanCount++;
        if (spanCount > 0) levelMap.set(startIndex, { rowIndex: startIndex, rowSpan: spanCount, value: currentValue ?? "" });

        i = paginatedFlatRowData[i]?.isSubtotal && (paginatedFlatRowData[i]?.subtotalLevel ?? 0) === levelIndex ? i + 1 : j;
      }

      map.set(levelIndex, levelMap);
    });

    return map;
  }

  // AGGREGATIONS
  static calculateAggregations(cellData: CSVRow[], values: ValueField[]): Record<string, string> {
    if (!cellData.length || !values.length) return {};
    const aggregations: Record<string, string> = {};

    values.forEach(({ field, aggregation }) => {
      const numericValues = cellData.map(row => {
        const val = row[field];
        const num = typeof val === "number" ? val : typeof val === "string" ? parseFloat(val) : NaN;
        return isNaN(num) ? null : num;
      }).filter((v): v is number => v !== null);

      let result = "";
      if (numericValues.length > 0) {
        const operations = {
          sum: () => _.sum(numericValues).toString(),
          avg: () => _.mean(numericValues).toFixed(2),
          count: () => numericValues.length.toString(),
          max: () => _.max(numericValues)?.toString() || "",
          min: () => _.min(numericValues)?.toString() || ""
        };
        result = operations[aggregation]?.() || "";
      } else if (aggregation === "count") {
        result = cellData.filter(r => r[field] != null).length.toString();
      }

      aggregations[`${field}_${aggregation}`] = result;
    });

    return aggregations;
  }

  // PIVOT DATA
  static calculatePivotData(
    csvData: CSVRow[], rows: string[], columns: string[], flatRowData: FlatRowData[], leafColumnKeys: string[], values: ValueField[]
  ): Record<string, Record<string, Record<string, string>>> {
    const data: Record<string, Record<string, Record<string, string>>> = {};

    // Only values
    if (!rows.length && !columns.length && values.length > 0) {
      data.total = { total: this.calculateAggregations(csvData, values) };
      return data;
    }

    // Rows only
    if (rows.length > 0 && !columns.length && values.length > 0) {
      flatRowData.forEach(rowData => {
        if (!rowData.isSubtotal) {
          const matchingRows = csvData.filter(row => rows.every((field, i) => String(row[field] ?? "") === rowData.values[i]));
          if (matchingRows.length > 0) {
            if (!data[rowData.key]) data[rowData.key] = {};
            // FIX: Add type safety for total property
            data[rowData.key]!.total = this.calculateAggregations(matchingRows, values);
          }
        }
      });

      // Calculate subtotals
      flatRowData.filter(row => row.isSubtotal).forEach(rowData => {
        const subtotalLevel = rowData.subtotalLevel ?? 0;
        const parentKeyPrefix = rowData.keys.slice(0, subtotalLevel + 1).join("|");
        const directChildren = flatRowData.filter(child => 
          child.key !== rowData.key && 
          child.keys.slice(0, subtotalLevel + 1).join("|") === parentKeyPrefix &&
          (child.isSubtotal ? child.subtotalLevel === subtotalLevel + 1 : child.keys.length === subtotalLevel + 2)
        );

        if (!data[rowData.key]) data[rowData.key] = {};
        const rowDataEntry = data[rowData.key]!;
        rowDataEntry.total = rowDataEntry.total || {};
        
        values.forEach(valueField => {
          const aggKey = `${valueField.field}_${valueField.aggregation}`;
          const childValues = directChildren.map(child => {
            const val = data[child.key]?.total?.[aggKey];
            return val && val !== "" && val !== "-" ? parseFloat(val) : null;
          }).filter((v): v is number => v !== null);

          rowDataEntry.total![aggKey] = childValues.length > 0 ? _.sum(childValues).toString() : "";
        });
      });

      return data;
    }

    // Columns only
    if (columns.length > 0 && !rows.length && values.length > 0) {
      data.total = {};
      const totalEntry = data.total;
      
      leafColumnKeys.forEach(colKey => {
        const matchingRows = csvData.filter(row => 
          columns.every((field, i) => String(row[field] ?? "") === (colKey.split("|")[i] || ""))
        );
        if (matchingRows.length > 0) {
          totalEntry[colKey] = this.calculateAggregations(matchingRows, values);
        }
      });
      return data;
    }

    // Full pivot  (Rows, columns, Values)
    flatRowData.filter(row => !row.isSubtotal).forEach(rowData => {
      if (!data[rowData.key]) data[rowData.key] = {};

      const rowDataEntry = data[rowData.key]!;

      if (columns.length > 0) {
        leafColumnKeys.forEach(colKey => {
          const matchingRows = csvData.filter(row => 
            rows.every((field, i) => String(row[field] ?? "") === rowData.values[i]) &&
            columns.every((field, i) => String(row[field] ?? "") === (colKey.split("|")[i] || ""))
          );
          if (matchingRows.length > 0) {
            rowDataEntry[colKey] = this.calculateAggregations(matchingRows, values);
          }
        });
      } else {
        const matchingRows = csvData.filter(row => rows.every((field, i) => String(row[field] ?? "") === rowData.values[i]));
        if (matchingRows.length > 0) {
          rowDataEntry.total = this.calculateAggregations(matchingRows, values);
        }
      }
    });

    // Column subtotals
    if (columns.length > 0) {
      flatRowData.filter(row => row.isSubtotal).forEach(rowData => {
        const subtotalLevel = rowData.subtotalLevel ?? 0;
        const parentKeyPrefix = rowData.keys.slice(0, subtotalLevel + 1).join("|");
        const directChildren = flatRowData.filter(child => 
          child.key !== rowData.key && 
          child.keys.slice(0, subtotalLevel + 1).join("|") === parentKeyPrefix &&
          (child.isSubtotal ? child.subtotalLevel === subtotalLevel + 1 : child.keys.length === subtotalLevel + 2)
        );

        if (!data[rowData.key]) data[rowData.key] = {};
        const rowDataEntry = data[rowData.key]!;

        leafColumnKeys.forEach(colKey => {
          if (!rowDataEntry[colKey]) rowDataEntry[colKey] = {};
          const colEntry = rowDataEntry[colKey]!;
          
          values.forEach(valueField => {
            const aggKey = `${valueField.field}_${valueField.aggregation}`;
            const childValues = directChildren.map(child => {
              const val = data[child.key]?.[colKey]?.[aggKey];
              return val && val !== "" && val !== "-" ? parseFloat(val) : null;
            }).filter((v): v is number => v !== null);

            colEntry[aggKey] = childValues.length > 0 ? _.sum(childValues).toString() : "";
          });
        });
      });
    }

    return data;
  }
}