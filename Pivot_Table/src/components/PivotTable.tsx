

import React, { useState, useMemo, useEffect, type DragEvent, type JSX } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  DragIndicator,
  Clear,
  ExpandMore,
  ExpandLess,
  
  UnfoldMore,
  UnfoldLess,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";
import InitialPivotTable from "./InitialPivotTable";

type CSVRow = Record<string, string | number | null | undefined>;

interface FieldZoneProps {
  label: string;
  fields: string[];
  onRemoveField: (field: string) => void;
  onClearAll: () => void;
  zoneId: string;
}

interface DraggableFieldProps {
  field: string;
  onDragStart: (field: string) => void;
}

interface NestedRowData {
  key: string;
  value: string;
  children: NestedRowData[];
  data: CSVRow[];
  level: number;
  isExpanded?: boolean;
}

interface NestedColumnData {
  key: string;
  value: string;
  children: NestedColumnData[];
  level: number;
  isExpanded?: boolean;
  colSpan: number;
  rowSpan: number;
}

const FieldZone: React.FC<FieldZoneProps> = ({
  label,
  fields,
  onRemoveField,
  onClearAll,
  zoneId,
}) => (
  <Paper
    sx={{
      p: 2,
      minWidth: 200,
      minHeight: 100,
      border: "2px dashed #ccc",
      bgcolor: "#f8f9fa",
      position: "relative",
    }}
    id={zoneId}
  >
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={1}
    >
      <Typography variant="subtitle2" fontWeight="bold">
        {label}
      </Typography>
      {fields.length > 0 && (
        <Tooltip title={`Clear all ${label.toLowerCase()}`}>
          <IconButton size="small" onClick={onClearAll}>
            <Clear fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
    <Box display="flex" flexWrap="wrap" gap={1} minHeight={40}>
      {fields.length === 0 ? (
        <Typography variant="caption" color="text.secondary" fontStyle="italic">
          Drop fields here
        </Typography>
      ) : (
        fields.map((field) => (
          <Chip
            key={field}
            label={field}
            color="success"
            size="small"
            onDelete={() => onRemoveField(field)}
            sx={{ cursor: "pointer" }}
          />
        ))
      )}
    </Box>
  </Paper>
);

const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  onDragStart,
}) => {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", field);
    onDragStart(field);
  };

  return (
    <Chip
      draggable
      onDragStart={handleDragStart}
      label={field}
      color="secondary"
      size="small"
      icon={<DragIndicator />}
      sx={{
        cursor: "grab",
        "&:active": { cursor: "grabbing" },
        transition: "all 0.2s",
        "&:hover": { transform: "scale(1.05)" },
      }}
    />
  );
};

const PivotTable: React.FC = () => {
  const csvData = useSelector((state: RootState) => state.csv.data) as CSVRow[];

  const slicedData = useMemo(() => csvData.slice(0, 100), [csvData]);

  const allColumns = useMemo(() => {
    if (!slicedData || slicedData.length === 0) return [];
    return Object.keys(slicedData[0] ?? {});
  }, [slicedData]);

  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [allColumnsExpanded, setAllColumnsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (allColumns.length > 0) {
      setAvailableFields(allColumns);
    }
  }, [allColumns]);

  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (zone: "rows" | "columns" | "values") => {
    if (!draggedField) return;

    const field = draggedField;

    if (availableFields.includes(field)) {
      setAvailableFields((prev) => prev.filter((f) => f !== field));
    } else if (rows.includes(field)) {
      setRows((prev) => prev.filter((f) => f !== field));
    } else if (columns.includes(field)) {
      setColumns((prev) => prev.filter((f) => f !== field));
    } else if (values.includes(field)) {
      setValues((prev) => prev.filter((f) => f !== field));
    }

    switch (zone) {
      case "rows":
        if (!rows.includes(field)) {
          setRows((prev) => [...prev, field]);
        }
        break;
      case "columns":
        if (!columns.includes(field)) {
          setColumns((prev) => [...prev, field]);
        }
        break;
      case "values":
        if (!values.includes(field)) {
          setValues((prev) => [...prev, field]);
        }
        break;
    }

    setDraggedField(null);
  };

  const removeFieldFromZone = (
    zone: "rows" | "columns" | "values",
    field: string
  ) => {
    switch (zone) {
      case "rows":
        setRows((prev) => prev.filter((f) => f !== field));
        break;
      case "columns":
        setColumns((prev) => prev.filter((f) => f !== field));
        break;
      case "values":
        setValues((prev) => prev.filter((f) => f !== field));
        break;
    }
    if (!availableFields.includes(field)) {
      setAvailableFields((prev) => [...prev, field]);
    }
  };

  const clearZone = (zone: "rows" | "columns" | "values") => {
    const fieldsToReturn: string[] = [];

    switch (zone) {
      case "rows":
        fieldsToReturn.push(...rows);
        setRows([]);
        break;
      case "columns":
        fieldsToReturn.push(...columns);
        setColumns([]);
        break;
      case "values":
        fieldsToReturn.push(...values);
        setValues([]);
        break;
    }

    setAvailableFields((prev) => [
      ...prev,
      ...fieldsToReturn.filter((field) => !prev.includes(field)),
    ]);
  };

  const nestedRowData = useMemo(() => {
    if (!rows.length || !slicedData.length) return [];

    const buildNestedStructure = (
      data: CSVRow[],
      level: number,
      parentKey: string = ""
    ): NestedRowData[] => {
      if (level >= rows.length) return [];

      const currentField = rows[level];
      const grouped = data.reduce((acc, row) => {
        const value =
          currentField && currentField in row
            ? String(row[currentField as keyof CSVRow] ?? "N/A")
            : "N/A";

        const key = parentKey ? `${parentKey}|${value}` : value;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, CSVRow[]>);

      return Object.entries(grouped).map(([key, groupData]) => {
        const value = key.split("|").pop() || "";
        const children = buildNestedStructure(groupData, level + 1, key);

        return {
          key,
          value,
          children,
          data: groupData,
          level,
          isExpanded: expandedRows.has(key),
        };
      });
    };

    return buildNestedStructure(slicedData, 0);
  }, [slicedData, rows, expandedRows]);

  const nestedColumnData = useMemo(() => {
    if (!columns.length || !slicedData.length) return [];

    const buildNestedStructure = (
      data: CSVRow[],
      level: number,
      parentKey: string = ""
    ): NestedColumnData[] => {
      if (level >= columns.length) return [];

      const currentField = columns[level];
      const grouped = data.reduce((acc, row) => {
        const value =
          currentField && currentField in row
            ? String(row[currentField as keyof CSVRow] ?? "N/A")
            : "N/A";

        const key = parentKey ? `${parentKey}|${value}` : value;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, CSVRow[]>);

      const nodes = Object.entries(grouped).map(([key, groupData]) => {
        const value = key.split("|").pop() || "";
        const children = buildNestedStructure(groupData, level + 1, key);
        
        const colSpan = children.length > 0 
          ? children.reduce((sum, child) => sum + child.colSpan, 0)
          : 1;
        
        const rowSpan = 1;

        return {
          key,
          value,
          children,
          level,
          isExpanded: allColumnsExpanded,
          colSpan,
          rowSpan,
        };
      });

      return nodes;
    };

    return buildNestedStructure(slicedData, 0);
  }, [slicedData, columns, allColumnsExpanded]);

  const parentColumnKeys = useMemo(() => {
    const getParentKeys = (nodes: NestedColumnData[]): string[] => {
      const keys: string[] = [];
      nodes.forEach(node => {
        if (node.children.length > 0) {
          keys.push(node.key);
          keys.push(...getParentKeys(node.children));
        }
      });
      return keys;
    };
    return getParentKeys(nestedColumnData);
  }, [nestedColumnData]);

  const leafColumnKeys = useMemo(() => {
    const getLeafKeys = (nodes: NestedColumnData[]): string[] => {
      const leaves: string[] = [];
      nodes.forEach((node) => {
        if (node.children.length === 0) {
          leaves.push(node.key);
        } else if (allColumnsExpanded) {
          leaves.push(...getLeafKeys(node.children));
        } else {
          leaves.push(node.key);
        }
      });
      return leaves;
    };

    return getLeafKeys(nestedColumnData);
  }, [nestedColumnData, allColumnsExpanded]);

  const pivotData = useMemo(() => {
    if (!slicedData.length) return {};

    const data: Record<string, Record<string, CSVRow[]>> = {};

    const getLeafRowKeys = (nodes: NestedRowData[]): string[] => {
      const leaves: string[] = [];
      nodes.forEach((node) => {
        if (node.children.length === 0) {
          leaves.push(node.key);
        } else if (expandedRows.has(node.key)) {
          leaves.push(...getLeafRowKeys(node.children));
        } else {
          leaves.push(node.key);
        }
      });
      return leaves;
    };

    const leafRowKeys = getLeafRowKeys(nestedRowData);

    leafRowKeys.forEach((rowKey) => {
      data[rowKey] = {};
      leafColumnKeys.forEach((colKey) => {
        data[rowKey]![colKey] = [];
      });
    });

    slicedData.forEach((row) => {
      const rowKey = rows
        .map((field) => String(row[field] ?? ""))
        .filter(Boolean)
        .join("|");
      
      const colKey = columns
        .map((field) => String(row[field] ?? ""))
        .filter(Boolean)
        .join("|");

      if (rowKey && colKey && data[rowKey] && data[rowKey][colKey] !== undefined) {
        data[rowKey][colKey].push(row);
      }
    });

    return data;
  }, [slicedData, rows, columns, nestedRowData, leafColumnKeys, expandedRows]);

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const toggleAllColumnsExpansion = () => {
    setAllColumnsExpanded(!allColumnsExpanded);
  };

  const getDisplayValue = (cellData: CSVRow[]) => {
    if (values.length === 0) {
      return "";
    }

    if (!cellData.length) return "-";

    const valueField = values[0];
    const firstValue = cellData[0]?.[valueField as keyof CSVRow];

    return String(firstValue ?? "-");
  };

  const renderNestedRows = (nodes: NestedRowData[]): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedRows.has(node.key);
      const paddingLeft = node.level * 4;

      const rowElement = (
        <TableRow
          key={node.key}
          sx={{
            backgroundColor:
              node.level % 2 === 0 ? "background.default" : "action.hover",
          }}
        >
          <TableCell
            sx={{
              fontWeight: "bold",
              borderRight: "1px solid #e0e0e0",
              minWidth: 150,
              pl: paddingLeft,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {hasChildren && (
              <IconButton
                size="small"
                onClick={() => toggleRowExpansion(node.key)}
                sx={{ p: 0 }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
            {node.value}
          </TableCell>

          {leafColumnKeys.map((colKey) => {
            const cellData = pivotData[node.key]?.[colKey] || [];
            return (
              <TableCell
                key={`${node.key}-${colKey}`}
                align="center"
                sx={{ minWidth: 100 }}
              >
                {getDisplayValue(cellData)}
              </TableCell>
            );
          })}
        </TableRow>
      );

      const childrenElements =
        hasChildren && isExpanded ? renderNestedRows(node.children) : [];

      return [rowElement, ...childrenElements];
    });
  };

  const renderMultiLevelColumnHeaders = () => {
    if (columns.length === 0) return [];

    const collectNodesByLevel = (nodes: NestedColumnData[], level: number, result: NestedColumnData[][]) => {
      if (!result[level]) result[level] = [];
      
      nodes.forEach((node) => {
        if (!result[level]) result[level] = [];
        result[level].push(node);

        if (node.children.length > 0 && allColumnsExpanded) {
          collectNodesByLevel(node.children, level + 1, result);
        }
      });
    };

    const levels: NestedColumnData[][] = [];
    collectNodesByLevel(nestedColumnData, 0, levels);

    return levels.map((levelNodes, levelIndex) => (
      <TableRow key={`col-level-${levelIndex}`} sx={{ backgroundColor: "primary.main" }}>
        {levelIndex === 0 && (
          <TableCell
            rowSpan={levels.length}
            sx={{
              fontWeight: "bold",
              color: "white",
              backgroundColor: "primary.main",
              minWidth: 150,
              borderRight: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <span>Rows ↓ | Columns →</span>
                {columns.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={toggleAllColumnsExpansion}
                    sx={{ 
                      color: "white", 
                      p: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    {allColumnsExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </Box>
            </Box>
          </TableCell>
        )}
        
        {levelNodes.map((node) => (
          <TableCell
            key={node.key}
            colSpan={node.colSpan}
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              color: "white",
              backgroundColor: levelIndex === 0 ? "primary.main" : "primary.light",
              minWidth: 120,
              borderRight: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {node.value}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

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

  const configuredFields = rows.length > 0 || columns.length > 0 || values.length > 0;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Pivot Table
      </Typography>

      <Box display="flex" gap={3} mb={4} flexWrap="wrap">
        <Box
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("rows")}
          flex={1}
          minWidth={250}
        >
          <FieldZone
            label="Rows"
            fields={rows}
            onRemoveField={(field) => removeFieldFromZone("rows", field)}
            onClearAll={() => clearZone("rows")}
            zoneId="rows"
          />
        </Box>

        <Box
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("columns")}
          flex={1}
          minWidth={250}
        >
          <FieldZone
            label="Columns"
            fields={columns}
            onRemoveField={(field) => removeFieldFromZone("columns", field)}
            onClearAll={() => clearZone("columns")}
            zoneId="columns"
          />
        </Box>

        <Box
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("values")}
          flex={1}
          minWidth={250}
        >
          <FieldZone
            label="Values"
            fields={values}
            onRemoveField={(field) => removeFieldFromZone("values", field)}
            onClearAll={() => clearZone("values")}
            zoneId="values"
          />
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Fields
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {availableFields.map((field) => (
            <DraggableField
              key={field}
              field={field}
              onDragStart={handleDragStart}
            />
          ))}
          {availableFields.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
            >
              All fields are in use. Remove fields from zones to make them
              available.
            </Typography>
          )}
        </Box>
      </Paper>

      

      {!configuredFields ? (
        <InitialPivotTable />
      ) : (
        (rows.length > 0 || columns.length > 0) && (
          <Paper sx={{ overflow: "auto", mt: 3 }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                {renderMultiLevelColumnHeaders()}
              </TableHead>

              <TableBody>{renderNestedRows(nestedRowData)}</TableBody>
            </Table>
          </Paper>
        )
      )}
    </Box>
  );
};

export default PivotTable;