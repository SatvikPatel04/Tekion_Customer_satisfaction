import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField, Button, Card, CardContent, Typography, Box, List, ListItem, ListItemText, Snackbar, Alert,
  Stack, Divider, Container, MenuItem, Select, InputLabel, FormControl
} from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { Link } from "react-router-dom";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export default function CustomersPage() {
  const [name, setName] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [dealershipId, setDealershipId] = useState("");
  const [dealerships, setDealerships] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const fetchDealerships = async () => {
    const res = await axios.get("http://localhost:5000/api/dealerships");
    setDealerships(res.data);
  };
  const fetchCustomers = async () => {
    const res = await axios.get("http://localhost:5000/api/customers");
    setCustomers(res.data);
  };

  useEffect(() => { fetchDealerships(); fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !carModel || !carYear || !regNumber || !dealershipId) {
      setSnack({ open: true, message: "Fill all fields!", severity: "warning" });
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/customers", {
        name,
        car: { model: carModel, year: parseInt(carYear), registrationNumber: regNumber },
        dealershipId,
      });
      setSnack({ open: true, message: "Customer added!", severity: "success" });
      setName(""); setCarModel(""); setCarYear(""); setRegNumber(""); setDealershipId("");
      fetchCustomers();
    } catch (err) {
      setSnack({ open: true, message: (err.response?.data?.error || "Could not add customer"), severity: "error" });
    }
  };
  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={4} sx={{ mb: 4, borderRadius: 3, background: "#fffde7" }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} mb={2}>Add Customer</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Customer Name" value={name} onChange={e => setName(e.target.value)} required variant="filled"
                InputProps={{ startAdornment: <PeopleAltRoundedIcon color="action" sx={{ mr: 1 }} /> }} />
              <TextField label="Car Model" value={carModel} onChange={e => setCarModel(e.target.value)} required variant="filled"
                InputProps={{ startAdornment: <DirectionsCarIcon color="action" sx={{ mr: 1 }} /> }} />
              <TextField label="Car Year" type="number" value={carYear} onChange={e => setCarYear(e.target.value)} required variant="filled" />
              <TextField label="Registration Number" value={regNumber} onChange={e => setRegNumber(e.target.value)} required variant="filled" />
              <FormControl required variant="filled">
                <InputLabel>Dealership</InputLabel>
                <Select value={dealershipId} onChange={e => setDealershipId(e.target.value)} label="Dealership">
                  {dealerships.map(d =>
                    <MenuItem value={d._id} key={d._id}>{d.company}</MenuItem>
                  )}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" size="large" fullWidth>
                Add Customer
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Customers</Typography>
          <Divider />
          {!customers.length ? (
            <Typography color="textSecondary" sx={{ pt: 3, pb: 2 }}>No customers yet.</Typography>
          ) : (
            <List>
              {customers.map(c =>
                <ListItem key={c._id} sx={{
                  bgcolor: "#fffde9", my: 1, borderRadius: 2, ":hover": { boxShadow: 2 }
                }}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ListItemText
                      primary={
                        <>
                          <b>{c.name}</b> &mdash; <span style={{ color: "#c68400" }}>{c.car?.model} ({c.car?.year}), {c.car?.registrationNumber}</span>
                        </>
                      }
                      secondary={c.dealershipId?.company || ""}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AnalyticsIcon />}
                      component={Link}
                      to={`/customers/${c._id}/analysis`}  // <-- fixed
                      sx={{ ml: 2 }}
                    >
                      View Analysis
                    </Button>
                  </Box>
                </ListItem>
              )}
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