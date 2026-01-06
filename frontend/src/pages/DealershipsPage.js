import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Stack,
  Divider,
  Container,
} from "@mui/material";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function DealershipsPage() {
  const [company, setCompany] = useState("");
  const [uniqueName, setUniqueName] = useState("");
  const [address, setAddress] = useState("");
  const [dealerships, setDealerships] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  // Fetch all dealerships
  const fetchDealerships = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/dealerships");
      setDealerships(res.data);
    } catch (err) {
      setSnack({ open: true, message: "Error loading dealerships!", severity: "error" });
    }
  };

  useEffect(() => {
    fetchDealerships();
    // eslint-disable-next-line
  }, []);

  // Add dealership
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !uniqueName || !address) {
      setSnack({ open: true, message: "Fill all fields!", severity: "warning" });
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/dealerships", {
        company,
        uniqueName,
        address,
      });
      setSnack({ open: true, message: "Dealership added!", severity: "success" });
      setCompany("");
      setUniqueName("");
      setAddress("");
      fetchDealerships();
    } catch (err) {
      setSnack({ open: true, message: (err.response?.data?.error || "Could not add dealership"), severity: "error" });
    }
  };

  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card elevation={4} sx={{ mb: 4, borderRadius: 3, background: "#e3f2fd" }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} mb={2}>Add Dealership</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                variant="filled"
                required
                InputProps={{ startAdornment: <AddBusinessOutlinedIcon color="action" sx={{ mr: 1 }} /> }}
              />
              <TextField
                label="Unique Name"
                value={uniqueName}
                onChange={(e) => setUniqueName(e.target.value)}
                variant="filled"
                required
              />
              <TextField
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                variant="filled"
                required
                InputProps={{ startAdornment: <LocationOnIcon color="action" sx={{ mr: 1 }} /> }}
              />
              <Button type="submit" variant="contained" size="large" fullWidth>
                Add Dealership
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Dealerships
          </Typography>
          <Divider />
          {!dealerships.length ? (
            <Typography color="textSecondary" sx={{ pt: 3, pb: 2 }}>
              No dealerships yet. Add one above!
            </Typography>
          ) : (
            <List>
  {dealerships.map((d) => (
    <ListItem key={d._id} sx={{
      bgcolor: "#f8fafc", my: 1, borderRadius: 2,
      ":hover": { boxShadow: 2 }
    }}>
      <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ListItemText
          primary={<>
            <b>{d.company}</b> <span style={{ color: "#1976d2" }}>({d.uniqueName})</span>
          </>}
          secondary={<Typography color="textSecondary">{d.address}</Typography>}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<AnalyticsIcon />}
          component={Link}
          to={`/dealerships/${d._id}/analysis`}
          sx={{ ml: 2 }}
        >
          View Analysis
        </Button>
      </Box>
    </ListItem>
  ))}
</List>
          )}
        </CardContent>
      </Card>
      <Snackbar open={snack.open} autoHideDuration={2300} onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}