import React from "react";
import { Box, Button, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Papa from "papaparse";
import { useDispatch } from "react-redux";
import { setCsvData } from "../store/csvSlice";
import "../styles/UploadFile.css";

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
    <Box className="upload-file-container">
      <CloudUploadIcon className="upload-file-icon" />
      <Typography className="upload-file-title" gutterBottom>
        Upload CSV File
      </Typography>
      <Typography className="upload-file-subtitle">
        Click here to browse CSV file
      </Typography>

      <Button
        variant="contained"
        component="label"
        size="large"
        startIcon={<CloudUploadIcon />}
        className="upload-file-button"
      >
        Choose CSV File
        <input 
          type="file" 
          accept=".csv" 
          hidden 
          onChange={handleFileChange}
          className="upload-file-input"
        />
      </Button>
    </Box>
  );
};

export default UploadFile;