import React, { type DragEvent, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import { DragIndicator, Clear, ArrowDropDown } from "@mui/icons-material";

type AggregationType = "sum" | "avg" | "count" | "max" | "min";

export interface ValueField {
  field: string;
  aggregation: AggregationType;
}

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

interface ValueFieldWithAggregationProps {
  valueField: ValueField;
  onChange: (field: string, aggregation: AggregationType) => void;
  onRemove: (field: string) => void;
}

interface FieldZonesProps {
  availableFields: string[];
  rows: string[];
  columns: string[];
  values: ValueField[];
  draggedField: string | null;
  onDragStart: (field: string) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (zone: "rows" | "columns" | "values") => void;
  onRemoveField: (zone: "rows" | "columns" | "values", field: string) => void;
  onClearZone: (zone: "rows" | "columns" | "values") => void;
  onUpdateValueAggregation: (field: string, aggregation: AggregationType) => void;
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

const ValueFieldWithAggregation: React.FC<ValueFieldWithAggregationProps> = ({ 
  valueField, 
  onChange, 
  onRemove 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleAggregationChange = (aggregation: AggregationType) => {
    onChange(valueField.field, aggregation);
    handleClose();
  };

  const aggregationLabels: Record<AggregationType, string> = {
    sum: "Sum",
    avg: "Average",
    count: "Count",
    max: "Max",
    min: "Min",
  };

  return (
    <div>
      <Chip
        label={`${valueField.field} (${valueField.aggregation})`}
        color="primary"
        size="small"
        onDelete={() => onRemove(valueField.field)}
        sx={{ cursor: "pointer", marginRight: 1 }}
        onClick={handleClick}
        icon={<ArrowDropDown />}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {Object.entries(aggregationLabels).map(([key, label]) => (
          <MenuItem
            key={key}
            onClick={() => handleAggregationChange(key as AggregationType)}
            selected={valueField.aggregation === key}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

const FieldZones: React.FC<FieldZonesProps> = ({
  availableFields,
  rows,
  columns,
  values,
  draggedField,
  onDragStart,
  onDragOver,
  onDrop,
  onRemoveField,
  onClearZone,
  onUpdateValueAggregation,
}) => {
  return (
    <>
      <Box display="flex" gap={3} mb={4} flexWrap="wrap">
        <Box
          onDragOver={onDragOver}
          onDrop={() => onDrop("rows")}
          flex={1}
          minWidth={250}
        >
          <FieldZone
            label="Rows"
            fields={rows}
            onRemoveField={(f) => onRemoveField("rows", f)}
            onClearAll={() => onClearZone("rows")}
            zoneId="rows"
          />
        </Box>
        <Box
          onDragOver={onDragOver}
          onDrop={() => onDrop("columns")}
          flex={1}
          minWidth={250}
        >
          <FieldZone
            label="Columns"
            fields={columns}
            onRemoveField={(f) => onRemoveField("columns", f)}
            onClearAll={() => onClearZone("columns")}
            zoneId="columns"
          />
        </Box>
        <Box
          onDragOver={onDragOver}
          onDrop={() => onDrop("values")}
          flex={1}
          minWidth={250}
        >
          <Paper
            sx={{
              p: 2,
              minWidth: 200,
              minHeight: 100,
              border: "2px dashed #ccc",
              bgcolor: "#f8f9fa",
              position: "relative",
            }}
            id="values"
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Values
              </Typography>
              {values.length > 0 && (
                <Tooltip title="Clear all values">
                  <IconButton size="small" onClick={() => onClearZone("values")}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} minHeight={40}>
              {values.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontStyle="italic"
                >
                  Drop fields here
                </Typography>
              ) : (
                values.map((valueField) => (
                  <ValueFieldWithAggregation
                    key={valueField.field}
                    valueField={valueField}
                    onChange={onUpdateValueAggregation}
                    onRemove={(field) => onRemoveField("values", field)}
                  />
                ))
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Fields
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {availableFields.map((f) => (
            <DraggableField key={f} field={f} onDragStart={onDragStart} />
          ))}
        </Box>
      </Paper>
    </>
  );
};

export default FieldZones;