import type { AggregationType } from "../types/FieldZones.types";
import type { DragEvent as ReactDragEvent } from "react";

export class FieldZonesService {
  // Map of aggregation type identifiers to their display labels
  static readonly aggregationLabels: Record<AggregationType, string> = {
    sum: "Sum",
    avg: "Average",
    count: "Count",
    max: "Max",
    min: "Min",
  };

  // Filters available fields based on user search input (case-insensitive)
  static filterAvailableFields(
    availableFields: string[],
    searchTerm: string
  ): string[] {
    return availableFields.filter((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Handles drag over event
  static handleDragOver(e: ReactDragEvent<HTMLDivElement>): void {
    e.preventDefault();
    if (e.currentTarget) e.currentTarget.style.backgroundColor = "#e3f2fd"; // Highlight zone
  }

  // Handles drag leave event
  static handleDragLeave(e: ReactDragEvent<HTMLDivElement>): void {
    e.preventDefault();
    if (e.currentTarget) e.currentTarget.style.backgroundColor = "#f8f9fa"; // Restore default color
  }

  // Handles drop event
  static handleDrop(
    e: ReactDragEvent<HTMLDivElement>,
    onFieldDrop: (field: string, fromZone?: string) => void
  ): void {
    e.preventDefault();
    if (e.currentTarget) e.currentTarget.style.backgroundColor = "#f8f9fa";

    if (e.dataTransfer) {
      const field = e.dataTransfer.getData("text/plain");
      const fromZone = e.dataTransfer.getData("fromZone");
      if (field) onFieldDrop(field, fromZone);
    }
  }

  // Handles drag start
  static handleDragStart(
    e: ReactDragEvent,
    field: string,
    fromZone: string,
    onDragStart: (field: string, fromZone: string) => void
  ): void {
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", field);
      e.dataTransfer.setData("fromZone", fromZone);
      onDragStart(field, fromZone);
    }
  }

  // Returns human-readable label for given aggregation type
  static getAggregationLabel(aggregation: AggregationType): string {
    return this.aggregationLabels[aggregation];
  }

  //  Returns list of all supported aggregation types
  static getAggregationTypes(): AggregationType[] {
    return Object.keys(this.aggregationLabels) as AggregationType[];
  }
}
