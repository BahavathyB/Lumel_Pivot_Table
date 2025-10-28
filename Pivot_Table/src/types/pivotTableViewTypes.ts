
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
  keys: string[];
  values: string[];
  data: CSVRow[];
  key: string;
  level: number;
  isSubtotal?: boolean;
  subtotalLevel?: number | undefined;
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

export interface PivotTableViewProps {
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