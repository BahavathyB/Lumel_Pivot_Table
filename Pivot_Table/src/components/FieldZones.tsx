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
      sx={{
        height: 100,
        minHeight: 100,
        paddingLeft: 1,
        border: "1.5px dashed #e0e0e0",
        backgroundColor: "white",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      id={zoneId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ backgroundColor: "white", flexShrink: 0, minHeight: 24 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ fontSize: "0.65rem" }}
        >
          {label}
        </Typography>
        {fields.length > 0 && (
          <Tooltip title={`Clear all ${label.toLowerCase()}`}>
            <IconButton size="small" onClick={onClearAll} sx={{ fontSize: 10 }}>
              <Clear fontSize="small" sx={{ fontSize: 10 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "2px", height: "2px" },
          "&::-webkit-scrollbar-track": {
            background: "#f5f5f5",
            borderRadius: "2px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: "2px",
            "&:hover": { background: "#a8a8a8" },
          },
          scrollbarWidth: "thin",
          scrollbarColor: "#c1c1c1 #f5f5f5",
        }}
      >
        {fields.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontStyle="italic"
              fontSize="0.6rem"
            >
              Drop fields here
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              minWidth: "min-content",
            }}
          >
            {fields.map((field) => (
              <Box key={field} sx={{ display: "flex", width: "fit-content" }}>
                <Chip
                  label={field}
                  icon={<DragIndicator />}
                  color= "primary"
                  size="small"
                  onDelete={() => onRemoveField(field)}
                  sx={{
                    cursor: "grab",
                    "&:active": { cursor: "grabbing" },
                    height: 15,
                    fontSize: 10,
                    padding: "0 6px",
                    "& .MuiChip-deleteIcon": { width: 16, height: 16 },
                    width: "fit-content",
                    flexShrink: 0,
                    backgroundColor: "#a3e1edff",
                    color: "black"
                  }}
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
      color="primary"
      size="small"
      icon={<DragIndicator />}
      sx={{
        cursor: "grab",
        "&:active": { cursor: "grabbing" },
        transition: "all 0.2s",
        "&:hover": { transform: "scale(1.05)" },
        height: 15,
        fontSize: 10,
        padding: "0 6px",
        "& .MuiChip-deleteIcon": { width: 16, height: 16 },
        flexShrink: 0,
        backgroundColor: "#a3e1edff",
                    color: "black"
      }}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <span>
              {valueField.field} ({valueField.aggregation})
            </span>
            <IconButton
              size="small"
              sx={{
                width: 16,
                height: 16,
                cursor: "pointer",
                padding: 0,
                margin: 0,
                minWidth: "auto",
                color: "inherit",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                handleClick(event);
              }}
            >
              <ArrowDropDown fontSize="small" sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        }
        icon={<DragIndicator />}
        color="primary"
        size="small"
        onDelete={() => onRemove(valueField.field)}
        sx={{
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          height: 15, // Slightly increased to accommodate the button
          fontSize: 10,
          padding: "0 4px",
          "& .MuiChip-deleteIcon": { width: 16, height: 16 },
          width: "fit-content",
          flexShrink: 0,
          "& .MuiChip-label": {
            padding: "0 4px",
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
          },
          backgroundColor: "#a3e1edff",
                    color: "black"
        }}
        onDragStart={handleDragStart}
        draggable
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
            sx={{ cursor: "pointer" }}
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
    <Paper
      sx={{
        height: "99%",
        pl: 2,
        pr: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        width: "85%",
        boxShadow:
          "0px 2px 4px rgba(0,0,0,0.2), \
           0px -2px 4px rgba(0,0,0,0.2), \
           2px 0px 4px rgba(0,0,0,0.2), \
           -2px 0px 4px rgba(0,0,0,0.2)",
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Search fields"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 1,
          mt:1,
          flexShrink: 0,
          "& .MuiInputBase-root": { height: 24, minHeight: 24, fontSize: 10 },
          "& .MuiInputBase-input": { padding: "2px 8px" },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ mb: 1, flexShrink: 0 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontSize: "0.7rem", fontWeight: "bold" }}
        >
          AVAILABLE FIELDS
        </Typography>
        <Box
          sx={{
            height: 100,
            overflow: "auto",
            p: 1,
            border: "1.5px dashed #e0e0e0",
            borderRadius: 1,
            backgroundColor: "white",
            "&::-webkit-scrollbar": { width: "4px", height: "4px" },
          }}
        >
          {filteredAvailableFields.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontStyle="italic"
                fontSize="0.65rem"
              >
                No fields available
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                width: "fit-content",
                minWidth: "100%",
              }}
            >
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

      <Box sx={{ mb: 1, flexShrink: 0 }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: "0.7rem" }}
        >
          GROUP FIELDS
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            minHeight: 100,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ width: "50%" }}>
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
          <Box sx={{ width: "50%" }}>
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

      <Box sx={{ mb: 1, flexShrink: 0 }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: "0.7rem" }}
        >
          AGGREGATION FIELDS
        </Typography>
        <Box
          sx={{
            p: 1,
            mb: 2,
            height: 100,
            border: "1.5px dashed #ccc",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
          }}
          id="values"
          onDragOver={onDragOver}
          onDrop={() => handleZoneDrop("values")}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ backgroundColor: "white", flexShrink: 0, minHeight: 24 }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ color: "black", fontSize: "0.7rem" }}
            >
              Value Fields
            </Typography>
            {values.length > 0 && (
              <Tooltip title="Clear all values">
                <IconButton size="small" onClick={() => onClearZone("values")}>
                  <Clear fontSize="small" sx={{ fontSize: 12 }}/>
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              "&::-webkit-scrollbar": { width: "2px", height: "2px" },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                "&:hover": { background: "#a8a8a8" },
              },
            }}
          >
            {values.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontStyle="italic"
                  fontSize="0.65rem"
                >
                  Drop fields here
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  minWidth: "min-content",
                }}
              >
                {values.map((valueField) => (
                  <Box
                    key={valueField.field}
                    sx={{ display: "flex", width: "fit-content" }}
                  >
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
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="error"
            sx={{
              width: "50px",
              height: "20px",
              fontSize: "0.7rem",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "error.light", color: "white" },
            }}
            onClick={() => onClearZone("all")}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FieldZones;
