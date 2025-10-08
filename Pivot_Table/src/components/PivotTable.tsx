import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DragIndicator, Clear } from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/csvStore";

type CSVRow = Record<string, string | number | null | undefined>;

interface FieldZoneProps {
  label: string;
  fields: string[];
  onRemoveField: (field: string) => void;
  onClearAll: () => void;
  zoneId: string;
}

const FieldZone: React.FC<FieldZoneProps> = ({ 
  label, 
  fields, 
  onRemoveField, 
  onClearAll,
  zoneId 
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
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
            color="primary"
            size="small"
            onDelete={() => onRemoveField(field)}
            sx={{ cursor: "pointer" }}
          />
        ))
      )}
    </Box>
  </Paper>
);

const DraggableField: React.FC<{ field: string; onDragStart: (field: string) => void }> = ({ 
  field, 
  onDragStart 
}) => {
  const handleDragStart = (e: React.DragEvent) => {
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
        "&:hover": { transform: "scale(1.05)" }
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

  React.useEffect(() => {
    if (allColumns.length > 0) {
      setAvailableFields(allColumns);
    }
  }, [allColumns]);

  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (zone: "rows" | "columns" | "values") => {
    if (!draggedField) return;

    const field = draggedField;
    
    if (availableFields.includes(field)) {
      setAvailableFields(prev => prev.filter(f => f !== field));
    } else if (rows.includes(field)) {
      setRows(prev => prev.filter(f => f !== field));
    } else if (columns.includes(field)) {
      setColumns(prev => prev.filter(f => f !== field));
    } else if (values.includes(field)) {
      setValues(prev => prev.filter(f => f !== field));
    }

    switch (zone) {
      case "rows":
        if (!rows.includes(field)) {
          setRows(prev => [...prev, field]);
        }
        break;
      case "columns":
        if (!columns.includes(field)) {
          setColumns(prev => [...prev, field]);
        }
        break;
      case "values":
        if (!values.includes(field)) {
          setValues(prev => [...prev, field]);
        }
        break;
    }

    setDraggedField(null);
  };

  const removeFieldFromZone = (zone: "rows" | "columns" | "values", field: string) => {
    switch (zone) {
      case "rows":
        setRows(prev => prev.filter(f => f !== field));
        break;
      case "columns":
        setColumns(prev => prev.filter(f => f !== field));
        break;
      case "values":
        setValues(prev => prev.filter(f => f !== field));
        break;
    }
    if (!availableFields.includes(field)) {
      setAvailableFields(prev => [...prev, field]);
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

    setAvailableFields(prev => [
      ...prev,
      ...fieldsToReturn.filter(field => !prev.includes(field))
    ]);
  };

  if (!csvData.length) {
    return (
      <Typography variant="h6" sx={{ mt: 5, textAlign: "center", color: "gray" }}>
        No CSV Data uploaded yet.
      </Typography>
    );
  }

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
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              All fields are in use. Remove fields from zones to make them available.
            </Typography>
          )}
        </Box>
      </Paper>

    </Box>
  );
};

export default PivotTable;