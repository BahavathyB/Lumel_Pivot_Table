import React from "react";
import { Paper, Typography, Button, Box, Chip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setCsvData } from "../store/csvSlice";
import type { RootState } from "../store/csvStore";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

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
      sx={{
        backgroundColor: "white",
        borderRadius: 0,
        borderBottom: "1px solid",
        borderBottomColor: "divider",
        height: 45,
        display: "flex",
        alignItems: "center",
        px: 0.5,
        position: "frozen"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(45deg, #1976d2, #00bcd4)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "1rem",
          }}
        >
          PIVOT TABLE
        </Typography>
      </Box>

      {hasData && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={`File name: ${fileName}`}
            color="success"
            size="small"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            sx={{
              borderRadius: 2,
              
              fontWeight: "bold",
              px: 2,
              "&:hover": {
                backgroundColor: "error.light",
                color: "white",
              },
            }}
          >
            change file
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default NavBar;
