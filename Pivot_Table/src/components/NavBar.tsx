import React from "react";
import { Paper, Typography, Button, Box, Chip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setCsvData } from "../store/csvSlice";
import type { RootState } from "../store/csvStore";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "../styles/NavBar.css";

const NavBar: React.FC = () => {
  const dispatch = useDispatch();
  const csvData = useSelector((state: RootState) => state.csv.data);
  const fileName = useSelector((state: RootState) => state.csv.filename);
  const hasData = csvData && csvData.length > 0;

  const handleReset = () => {
    dispatch(setCsvData({ data: [], filename: "" }));
  };

  return (
    <Paper
      elevation={6}
      className="navbar-paper"
    >
      <Box className="navbar-container">
        <Typography
          variant="h6"
          component="div"
          className="navbar-title"
        >
          PIVOT TABLE
        </Typography>
      </Box>

      {hasData && (
        <Box className="navbar-content">
          <Chip
            label={`File name: ${fileName}`}
            variant="outlined"
            size="small"
            className="navbar-chip"
          />
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<RestartAltIcon className="navbar-button-icon" />}
            onClick={handleReset}
            className="navbar-button"
          >
            Change file
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default NavBar;