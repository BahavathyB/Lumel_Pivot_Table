import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Papa from "papaparse";
import { useDispatch } from "react-redux";
import { setCsvData } from "../store/csvSlice";

const UploadFile: React.FC = () => {
  const dispatch = useDispatch();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log("Parsed CSV:", result.data);
        dispatch(
          setCsvData({
            data: result.data as any[],
            filename: file.name,
          })
        );
      },
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px dashed #8c9294ff",
        borderRadius: 2,
        p: 3,
        width: "40%",
        textAlign: "center",
        m: "auto",
        mt: "20px",
        height: "80%",
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Upload CSV File
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop your CSV file here or click to browse
      </Typography>

      <Button
        variant="contained"
        component="label"
        size="large"
        startIcon={<CloudUploadIcon />}
      >
        Choose CSV File
        <input type="file" accept=".csv" hidden onChange={handleFileChange} />
      </Button>
    </Box>
  );
};

export default UploadFile;
