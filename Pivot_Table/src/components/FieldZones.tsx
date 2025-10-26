import React, { type DragEvent, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  DragIndicator,
  Clear,
  ArrowDropDown,
  Search,
} from "@mui/icons-material";
import "../styles/FieldZones.css";

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
  onFieldDrop: (field: string, fromZone?: string) => void;
  onFieldDragStart: (field: string, fromZone: string) => void;
  zoneType: "rows" | "columns" | "values";
}

interface DraggableFieldProps {
  field: string;
  onDragStart: (field: string, fromZone: string) => void;
  fromZone: string;
}

interface ValueFieldWithAggregationProps {
  valueField: ValueField;
  onChange: (field: string, aggregation: AggregationType) => void;
  onRemove: (field: string) => void;
  onDragStart: (field: string, fromZone: string) => void;
  fromZone: string;
}

interface FieldZonesProps {
  availableFields: string[];
  rows: string[];
  columns: string[];
  values: ValueField[];
  draggedField: string | null;
  onDragStart: (field: string, fromZone: string) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (
    zone: "rows" | "columns" | "values",
    field?: string,
    fromZone?: string
  ) => void;
  onRemoveField: (zone: "rows" | "columns" | "values", field: string) => void;
  onClearZone: (zone: "rows" | "columns" | "values" | "all") => void;
  onUpdateValueAggregation: (
    field: string,
    aggregation: AggregationType
  ) => void;
  onFieldMove: (
    fromZone: "rows" | "columns" | "values",
    toZone: "rows" | "columns" | "values",
    field: string
  ) => void;
}

// ----------------------------- FIELD ZONE -----------------------------
const FieldZone: React.FC<FieldZoneProps> = ({
  label,
  fields,
  onRemoveField,
  onClearAll,
  zoneId,
  onFieldDrop,
  onFieldDragStart,
  zoneType,
}) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#e3f2fd";
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#f8f9fa";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#f8f9fa";
    const field = e.dataTransfer.getData("text/plain");
    const fromZone = e.dataTransfer.getData("fromZone");
    if (field) onFieldDrop(field, fromZone);
  };

  return (
    <Box
      className="field-zone-base"
      id={zoneId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box className="field-zone-header">
        <Typography className="field-zone-label">
          {label}
        </Typography>
        {fields.length > 0 && (
          <Tooltip title={`Clear all ${label.toLowerCase()}`}>
            <IconButton size="small" onClick={onClearAll} className="icon-button-small">
              <Clear fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box className="field-zone-content">
        {fields.length === 0 ? (
          <Box className="empty-state">
            <Typography className="empty-state-text">
              Drop fields here
            </Typography>
          </Box>
        ) : (
          <Box className="field-items-layout">
            {fields.map((field) => (
              <Box key={field} className="field-item-container">
                <Chip
                  label={field}
                  icon={<DragIndicator />}
                  size="small"
                  onDelete={() => onRemoveField(field)}
                  className="chip-base"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", field);
                    e.dataTransfer.setData("fromZone", zoneType);
                    onFieldDragStart(field, zoneType);
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ----------------------------- DRAGGABLE FIELD -----------------------------
const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  onDragStart,
  fromZone,
}) => {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", field);
    e.dataTransfer.setData("fromZone", fromZone);
    onDragStart(field, fromZone);
  };

  return (
    <Chip
      draggable
      onDragStart={handleDragStart}
      label={field}
      size="small"
      icon={<DragIndicator />}
      className="chip-base"
    />
  );
};

// ----------------------------- VALUE FIELD WITH AGGREGATION -----------------------------
const ValueFieldWithAggregation: React.FC<ValueFieldWithAggregationProps> = ({
  valueField,
  onChange,
  onRemove,
  onDragStart,
  fromZone,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleAggregationChange = (aggregation: AggregationType) => {
    onChange(valueField.field, aggregation);
    handleClose();
  };

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", valueField.field);
    e.dataTransfer.setData("fromZone", fromZone);
    onDragStart(valueField.field, fromZone);
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
        label={
          <Box className="value-field-inner-box">
            <span>
              {valueField.field} ({valueField.aggregation})
            </span>
            <IconButton
              size="small"
              className="aggregation-button"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                handleClick(event);
              }}
            >
              <ArrowDropDown fontSize="small" />
            </IconButton>
          </Box>
        }
        icon={<DragIndicator />}
        size="small"
        onDelete={() => onRemove(valueField.field)}
        className="value-field-chip"
        onDragStart={handleDragStart}
        draggable
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        className="aggregation-menu"
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

// ----------------------------- MAIN FIELD ZONES -----------------------------
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
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAvailableFields = useMemo(
    () =>
      availableFields.filter((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [availableFields, searchTerm]
  );

  const handleFieldDrop = (
    zone: "rows" | "columns" | "values",
    field?: string,
    fromZone?: string
  ) => {
    if (field) onDrop(zone, field, fromZone);
  };

  const handleZoneDrop = (zone: "rows" | "columns" | "values") => {
    if (draggedField) onDrop(zone);
  };

  const handleFieldDragStart = (field: string, fromZone: string) =>
    onDragStart(field, fromZone);

  return (
    <Paper className="field-zones-paper">
      <TextField
        fullWidth
        size="small"
        placeholder="Search fields"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="field-zones-search"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Box className="section-container">
        <Typography className="field-zones-title">
          AVAILABLE FIELDS
        </Typography>
        <Box className="available-fields-container">
          {filteredAvailableFields.length === 0 ? (
            <Box className="empty-state">
              <Typography className="empty-state-text">
                No fields available
              </Typography>
            </Box>
          ) : (
            <Box className="fields-layout">
              {filteredAvailableFields.map((f) => (
                <DraggableField
                  key={f}
                  field={f}
                  onDragStart={handleFieldDragStart}
                  fromZone="available"
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Box className="section-container">
        <Typography className="field-zones-subtitle">
          GROUP FIELDS
        </Typography>
        <Box className="group-fields-container">
          <Box className="group-field-half">
            <FieldZone
              label="Row Fields"
              fields={rows}
              onRemoveField={(f) => onRemoveField("rows", f)}
              onClearAll={() => onClearZone("rows")}
              zoneId="rows"
              onFieldDrop={(field, fromZone) =>
                handleFieldDrop("rows", field, fromZone)
              }
              onFieldDragStart={handleFieldDragStart}
              zoneType="rows"
            />
          </Box>
          <Box className="group-field-half">
            <FieldZone
              label="Column Fields"
              fields={columns}
              onRemoveField={(f) => onRemoveField("columns", f)}
              onClearAll={() => onClearZone("columns")}
              zoneId="columns"
              onFieldDrop={(field, fromZone) =>
                handleFieldDrop("columns", field, fromZone)
              }
              onFieldDragStart={handleFieldDragStart}
              zoneType="columns"
            />
          </Box>
        </Box>
      </Box>

      <Box className="section-container">
        <Typography className="field-zones-subtitle">
          AGGREGATION FIELDS
        </Typography>
        <Box
          className="value-field-container"
          id="values"
          onDragOver={onDragOver}
          onDrop={() => handleZoneDrop("values")}
        >
          <Box className="field-zone-header">
            <Typography className="field-zone-label-black">
              Value Fields
            </Typography>
            {values.length > 0 && (
              <Tooltip title="Clear all values">
                <IconButton size="small" onClick={() => onClearZone("values")} className="icon-button-small">
                  <Clear fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box className="field-zone-content">
            {values.length === 0 ? (
              <Box className="empty-state">
                <Typography className="empty-state-text">
                  Drop fields here
                </Typography>
              </Box>
            ) : (
              <Box className="field-items-layout">
                {values.map((valueField) => (
                  <Box key={valueField.field} className="field-item-container">
                    <ValueFieldWithAggregation
                      valueField={valueField}
                      onChange={onUpdateValueAggregation}
                      onRemove={(field) => onRemoveField("values", field)}
                      onDragStart={handleFieldDragStart}
                      fromZone="values"
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box className="reset-button-container">
        <Button
          variant="outlined"
          color="error"
          className="reset-button"
          onClick={() => onClearZone("all")}
        >
          Reset
        </Button>
      </Box>
    </Paper>
  );
};

export default FieldZones;