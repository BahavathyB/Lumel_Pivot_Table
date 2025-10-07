import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Papa from "papaparse";
import { useDispatch } from "react-redux";
import { setCsvData } from "../store/csvSlice";

const UploadFile: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const dispatch = useDispatch();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log("Parsed CSV:", result.data);
        dispatch(setCsvData(result.data as any[]));
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
        border: "2px dashed #ccc",
        borderRadius: 2,
        p: 4,
        width: 400,
        textAlign: "center",
        m: "auto",
        mt: 5,
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Upload CSV File
      </Typography>

      <Button
        variant="contained"
        component="label"
        startIcon={<CloudUploadIcon />}
      >
        Choose CSV
        <input type="file" accept=".csv" hidden onChange={handleFileChange} />
      </Button>

      {fileName && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Selected File: <strong>{fileName}</strong>
        </Typography>
      )}
    </Box>
  );
};

export default UploadFile;
