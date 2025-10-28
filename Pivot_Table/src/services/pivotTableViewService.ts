
import type {
  CSVRow,
  ValueField,
  FlatRowData,
  FinalColumn,
  NestedColumnData,
} from "../types/pivotTableViewTypes";

export class PivotTableViewService {

  static calculateAggregation(data: CSVRow[], valueField: ValueField): string {
    if (data.length === 0) return "";

    // Extract numeric values
    const numericValues = data
      .map(row => {
        const val = row[valueField.field];
        if (val === null || val === undefined || val === "") return null;
        const num = parseFloat(String(val));
        return isNaN(num) ? null : num;
      })
      .filter((v): v is number => v !== null);

    // No numeris -> count
    if (numericValues.length === 0) {
      return valueField.aggregation === "count" ? data.length.toString() : "";
    }

    // Aggregation based on selection
    switch (valueField.aggregation) {
      case "sum":
        return numericValues.reduce((sum, val) => sum + val, 0).toString();
      case "avg":
        return (
          numericValues.reduce((sum, val) => sum + val, 0) /
          numericValues.length
        ).toFixed(2);
      case "count":
        return numericValues.length.toString();
      case "max":
        return Math.max(...numericValues).toString();
      case "min":
        return Math.min(...numericValues).toString();
      default:
        return "";
    }
  }

  // Calculate Grand Total
  static calculateGrandTotal(
    flatRowData: FlatRowData[],
    finalColumns: FinalColumn[],
    pivotData: Record<string, Record<string, Record<string, string>>>
  ): Record<string, string> {
    const grandTotalData: Record<string, string> = {};

    finalColumns.forEach(({ key, colKey, valueField }) => {
      const aggKey = `${valueField.field}_${valueField.aggregation}`;
      const columnValues: number[] = [];

      flatRowData.forEach(rowData => {
        if (!rowData.isSubtotal) {
          const val = pivotData[rowData.key]?.[colKey]?.[aggKey];
          if (val && val !== "" && val !== "-") {
            const num = parseFloat(val);
            if (!isNaN(num)) columnValues.push(num);
          }
        }
      });

      grandTotalData[key] =
        columnValues.length > 0
          ? columnValues.reduce((sum, val) => sum + val, 0).toString()
          : "";
    });

    return grandTotalData;
  }

  // nested column structure to flat level objects
  static buildColumnLevels(
    buildNestedColumns: NestedColumnData[]
  ): NestedColumnData[][] {
    const levels: NestedColumnData[][] = [];
    if (buildNestedColumns.length === 0) return levels;

    // Recursive function to group columns by depth level
    const collectByLevel = (nodes: NestedColumnData[], level: number) => {
      levels[level] = levels[level] || [];
      levels[level].push(...nodes);
      nodes.forEach(n => n.children.length && collectByLevel(n.children, level + 1));
    };

    collectByLevel(buildNestedColumns, 0);
    return levels;
  }

  static calculateTotalHeaderRows(columns: string[], values: ValueField[]): number {
    return (columns.length > 0 ? columns.length : 0) + (values.length > 0 ? 1 : 0);
  }


  // map each (column × valueField) pair into a renderable column cell.
  static generateValueColumns(
    leafColumnKeys: string[],
    values: ValueField[]
  ): Array<{ key: string; valueField: ValueField }> {
    if (leafColumnKeys.length > 0) {
      // Multiple leaf columns — expand into combinations
      return leafColumnKeys.flatMap(colKey =>
        values.map(valueField => ({
          key: `${colKey}-${valueField.field}`,
          valueField,
        }))
      );
    } else {
      // No column grouping — just use value fields directly
      return values.map(valueField => ({
        key: `value-${valueField.field}`,
        valueField,
      }));
    }
  }

  // show grand total row
  static shouldShowGrandTotal(rows: string[], values: ValueField[]): boolean {
    return rows.length === 0 || values.length === 0;
  }

//  For sticky
  static calculateGrandTotalTop(totalHeaderRows: number): number {
    return 30 * totalHeaderRows;
  }
}
