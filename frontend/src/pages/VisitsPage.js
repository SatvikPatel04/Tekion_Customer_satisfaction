import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField, Button, Card, CardContent, Typography, Box, List, ListItem, ListItemText, Snackbar, Alert,
  Stack, Divider, Container, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel
} from "@mui/material";
import DepartureBoardIcon from "@mui/icons-material/DepartureBoard";
// Top of file
import { Link } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function VisitsPage() {
  const [customerId, setCustomerId] = useState("");
  const [dealershipId, setDealershipId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [serviceDelayInDays, setServiceDelayInDays] = useState("");
  const [price, setPrice] = useState("");
  const [feedbackStars, setFeedbackStars] = useState("");
  const [feedbackProvided, setFeedbackProvided] = useState(false);
  const [repeatIssues, setRepeatIssues] = useState("");
  const [wasIssueResolved, setWasIssueResolved] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [dealerships, setDealerships] = useState([]);
  const [visits, setVisits] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    axios.get("http://localhost:5000/api/customers").then(res => setCustomers(res.data));
    axios.get("http://localhost:5000/api/dealerships").then(res => setDealerships(res.data));
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    const res = await axios.get("http://localhost:5000/api/visits");
    setVisits(res.data);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!customerId || !dealershipId || !visitDate || serviceDelayInDays === "" || price === "" || repeatIssues === "") {
      setSnack({ open: true, message: "Fill all fields (except feedback)!", severity: "warning" });
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/visits", {
        customerId,
        dealershipId,
        visitDate,
        serviceDelayInDays: Number(serviceDelayInDays),
        price: Number(price),
        feedback: feedbackProvided ? { stars: Number(feedbackStars), feedbackProvided: true } : { stars: null, feedbackProvided: false },
        repeatIssues: Number(repeatIssues),
        wasIssueResolved,
      });
      setSnack({ open: true, message: "Visit added!", severity: "success" });
      setCustomerId(""); setDealershipId(""); setVisitDate("");
      setServiceDelayInDays(""); setPrice(""); setFeedbackStars(""); setFeedbackProvided(false); setRepeatIssues(""); setWasIssueResolved(false);
      fetchVisits();
    } catch (err) {
      setSnack({ open: true, message: (err.response?.data?.error || "Could not add visit"), severity: "error" });
    }
  };
  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={4} sx={{ mb: 4, borderRadius: 3, background: "#e0f7fa" }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} mb={2}>Add Visit</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl required variant="filled">
                <InputLabel>Customer</InputLabel>
                <Select value={customerId} onChange={e => setCustomerId(e.target.value)} label="Customer">
                  {customers.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl required variant="filled">
                <InputLabel>Dealership</InputLabel>
                <Select value={dealershipId} onChange={e => setDealershipId(e.target.value)} label="Dealership">
                  {dealerships.map(d => <MenuItem key={d._id} value={d._id}>{d.company}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Visit Date" type="date" variant="filled"
                value={visitDate} onChange={e => setVisitDate(e.target.value)}
                InputLabelProps={{ shrink: true }} required
              />
              <TextField label="Service Delay (Days)" type="number" variant="filled"
                value={serviceDelayInDays} onChange={e => setServiceDelayInDays(e.target.value)} required
              />
              <TextField label="Price (Rs)" type="number" variant="filled"
                value={price} onChange={e => setPrice(e.target.value)} required
              />
              <FormControlLabel
                control={<Checkbox checked={feedbackProvided} onChange={e => setFeedbackProvided(e.target.checked)} />}
                label="Feedback Provided"
              />
              {feedbackProvided && (
                <TextField label="Feedback Stars" type="number" variant="filled"
                  value={feedbackStars} onChange={e => setFeedbackStars(e.target.value)} inputProps={{ min: 1, max: 5 }} required
                />
              )}
              <TextField label="Repeat Issues" type="number" variant="filled"
                value={repeatIssues} onChange={e => setRepeatIssues(e.target.value)} required
              />
              <FormControlLabel
                control={<Checkbox checked={wasIssueResolved} onChange={e => setWasIssueResolved(e.target.checked)} />}
                label="Issue Resolved"
              />
              <Button type="submit" variant="contained" size="large" fullWidth>
                Add Visit
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Visits</Typography>
          <Divider />
          {!visits.length ? (
            <Typography color="textSecondary" sx={{ pt: 3, pb: 2 }}>No visits yet.</Typography>
          ) : (
            <List>
              {visits.map(v =>
                <ListItem key={v._id} sx={{
                  bgcolor: "#e0f7fa", my: 1, borderRadius: 2, ":hover": { boxShadow: 2 }
                }}>
                  <ListItemText
                    primary={<>
                      <b>{v.customerId?.name}</b> @ <b>{v.dealershipId?.company}</b> &mdash; <span>{v.visitDate && v.visitDate.substring(0, 10)}</span>
                    </>}
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary">
                          Delay: {v.serviceDelayInDays} days, Rs. {v.price}, Repeat: {v.repeatIssues}, {v.wasIssueResolved ? "Resolved" : "Unresolved"}
                          {" — "}
                          Feedback: {v.feedback?.feedbackProvided ? `${v.feedback?.stars}★` : "None"}
                        </Typography>
                      </>
                    }
                  />
                  <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          component={Link}
          to={`/visits/${v._id}/analysis`}
          sx={{ ml: 2 }}
        >
          View Risk Analysis
        </Button>

                </ListItem>
              )}
            </List>
          )}
        </CardContent>
      </Card>
      <Snackbar open={snack.open} autoHideDuration={2300} onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}