import React, { type DragEvent as ReactDragEvent, useState, useMemo } from "react";
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

import type {
  FieldZoneProps,
  DraggableFieldProps,
  ValueFieldWithAggregationProps,
  FieldZonesProps,
} from "../types/fieldZonesTypes";
import { FieldZonesService } from "../services/fieldZonesService";




// Individual field zone for rows/columns
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
  return (
    <Box 
      className="field-zone-base" 
      id={zoneId}
      onDragOver={FieldZonesService.handleDragOver}
      onDragLeave={FieldZonesService.handleDragLeave}
      onDrop={(e: ReactDragEvent<HTMLDivElement>) => FieldZonesService.handleDrop(e, onFieldDrop)}
    >
      <Box className="field-zone-header">
        <Typography className="field-zone-label">{label}</Typography>
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
            <Typography className="empty-state-text">Drop fields here</Typography>
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
                  onDragStart={(e: ReactDragEvent) => FieldZonesService.handleDragStart(e, field, zoneType, onFieldDragStart)}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};


// Draggable field chip for available fields
const DraggableField: React.FC<DraggableFieldProps> = ({ field, onDragStart, fromZone }) => {
  return (
    <Chip
      draggable
      onDragStart={(e: ReactDragEvent) => FieldZonesService.handleDragStart(e, field, fromZone, onDragStart)}
      label={field}
      size="small"
      icon={<DragIndicator />}
      className="chip-base"
    />
  );
};


 // Value field with aggregation dropdown
const ValueFieldWithAggregation: React.FC<ValueFieldWithAggregationProps> = ({
  valueField,
  onChange,
  onRemove,
  onDragStart,
  fromZone,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
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
        onDragStart={(e: ReactDragEvent) => FieldZonesService.handleDragStart(e, valueField.field, fromZone, onDragStart)}
        draggable
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        className="aggregation-menu"
      >
        {FieldZonesService.getAggregationTypes().map((aggregation) => (
          <MenuItem
            key={aggregation}
            onClick={() => {
              onChange(valueField.field, aggregation);
              setAnchorEl(null);
            }}
            selected={valueField.aggregation === aggregation}
          >
            {FieldZonesService.getAggregationLabel(aggregation)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};


 // Main FieldZones component
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
    () => FieldZonesService.filterAvailableFields(availableFields, searchTerm),
    [availableFields, searchTerm]
  );

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
        <Typography className="field-zones-title">AVAILABLE FIELDS</Typography>
        <Box className="available-fields-container">
          {filteredAvailableFields.length === 0 ? (
            <Box className="empty-state">
              <Typography className="empty-state-text">No fields available</Typography>
            </Box>
          ) : (
            <Box className="fields-layout">
              {filteredAvailableFields.map((field) => (
                <DraggableField
                  key={field}
                  field={field}
                  onDragStart={onDragStart}
                  fromZone="available"
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>


      <Box className="section-container">
        <Typography className="field-zones-subtitle">GROUP FIELDS</Typography>
        <Box className="group-fields-container">
          <Box className="group-field-half">
            <FieldZone
              label="Row Fields"
              fields={rows}
              onRemoveField={(field) => onRemoveField("rows", field)}
              onClearAll={() => onClearZone("rows")}
              zoneId="rows"
              onFieldDrop={(field, fromZone) => onDrop("rows", field, fromZone)}
              onFieldDragStart={onDragStart}
              zoneType="rows"
            />
          </Box>
          <Box className="group-field-half">
            <FieldZone
              label="Column Fields"
              fields={columns}
              onRemoveField={(field) => onRemoveField("columns", field)}
              onClearAll={() => onClearZone("columns")}
              zoneId="columns"
              onFieldDrop={(field, fromZone) => onDrop("columns", field, fromZone)}
              onFieldDragStart={onDragStart}
              zoneType="columns"
            />
          </Box>
        </Box>
      </Box>


      <Box className="section-container">
        <Typography className="field-zones-subtitle">AGGREGATION FIELDS</Typography>
        <Box
          className="value-field-container"
          id="values"
          onDragOver={onDragOver}
          onDrop={() => draggedField && onDrop("values")}
        >
          <Box className="field-zone-header">
            <Typography className="field-zone-label-black">Value Fields</Typography>
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
                <Typography className="empty-state-text">Drop fields here</Typography>
              </Box>
            ) : (
              <Box className="field-items-layout">
                {values.map((valueField) => (
                  <Box key={valueField.field} className="field-item-container">
                    <ValueFieldWithAggregation
                      valueField={valueField}
                      onChange={onUpdateValueAggregation}
                      onRemove={(field) => onRemoveField("values", field)}
                      onDragStart={onDragStart}
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