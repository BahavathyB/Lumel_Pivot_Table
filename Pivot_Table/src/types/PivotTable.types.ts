
export type CSVRow = Record<string, string | number | null | undefined>;

export type AggregationType = "sum" | "avg" | "count" | "max" | "min";

export interface ValueField {
  field: string; 
  aggregation: AggregationType;
}

export interface NestedRowData {
  key: string;
  value: string; 
  children: NestedRowData[]; 
  data: CSVRow[]; 
  level: number; 
}

export interface NestedColumnData {
  key: string; 
  value: string; 
  children: NestedColumnData[];
  level: number; 
  colSpan: number;
  rowSpan: number;
}

export interface FlatRowData {
  key: string;
  parentId: string | null;
  values: string[]; 
  data: CSVRow[];
  level: number;
  isSubtotal?: boolean; 
  subtotalLevel?: number;
}

export interface FinalColumn {
  key: string;
  colKey: string;
  valueField: ValueField;
  label: string;
}

export interface RowSpanInfo {
  rowIndex: number;
  rowSpan: number;
  value: string;
}

export interface PivotTableState {
  availableFields: string[];
  rows: string[];
  columns: string[];
  values: ValueField[];
  draggedField: string | null;
  page: number;
  rowsPerPage: number;
  paginatedFlatRowData: FlatRowData[];
  pivotData: Record<string, Record<string, Record<string, string>>>;
}
