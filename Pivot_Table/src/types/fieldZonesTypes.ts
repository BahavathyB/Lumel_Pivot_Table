import type { DragEvent as ReactDragEvent } from 'react';

export type AggregationType = "sum" | "avg" | "count" | "max" | "min";

export interface ValueField {
  field: string;
  aggregation: AggregationType;
}

export interface FieldZoneProps {
  label: string;
  fields: string[];
  onRemoveField: (field: string) => void;
  onClearAll: () => void;
  zoneId: string;
  onFieldDrop: (field: string, fromZone?: string) => void;
  onFieldDragStart: (field: string, fromZone: string) => void;
  zoneType: "rows" | "columns" | "values";
}

export interface DraggableFieldProps {
  field: string;
  onDragStart: (field: string, fromZone: string) => void;
  fromZone: string;
}

export interface ValueFieldWithAggregationProps {
  valueField: ValueField;
  onChange: (field: string, aggregation: AggregationType) => void;
  onRemove: (field: string) => void;
  onDragStart: (field: string, fromZone: string) => void;
  fromZone: string;
}

export interface FieldZonesProps {
  availableFields: string[];
  rows: string[];
  columns: string[];
  values: ValueField[];
  draggedField: string | null;
  onDragStart: (field: string, fromZone: string) => void;
  onDragOver: (e: ReactDragEvent) => void;
  onDrop: (zone: "rows" | "columns" | "values", field?: string, fromZone?: string) => void;
  onRemoveField: (zone: "rows" | "columns" | "values", field: string) => void;
  onClearZone: (zone: "rows" | "columns" | "values" | "all") => void;
  onUpdateValueAggregation: (field: string, aggregation: AggregationType) => void;
  onFieldMove: (fromZone: "rows" | "columns" | "values", toZone: "rows" | "columns" | "values", field: string) => void;
}