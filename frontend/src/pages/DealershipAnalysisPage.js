import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Card, CardContent, Typography, Box, Chip, Stack, Divider, CircularProgress, Alert,
  Button, Tooltip, Container, Table, TableBody, TableCell, TableRow, LinearProgress, List, ListItem, ListItemText
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { calculateVisitRiskScore } from "./CustomerAnalysisPage"; // or copy/paste here

export default function DealershipAnalysisPage() {
  const { id } = useParams();
  const [dealership, setDealership] = useState(null);
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    (async () => {
      try {
        const resDealership = await axios.get(`http://localhost:5000/api/dealerships/${id}`);
        setDealership(resDealership.data);
        const resVisits = await axios.get(`http://localhost:5000/api/visits?dealershipId=${id}`);
        setVisits(resVisits.data);
      } catch (e) {
        setError("Could not fetch dealership/visits.");
      }
    })();
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!dealership) return <Box mt={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  const visitScores = visits.map(v => calculateVisitRiskScore(v));
  const riskSum = visitScores.reduce((a, s) => a + s.riskScore, 0);
  const avgScore = visitScores.length ? Math.round(riskSum / visitScores.length) : 0;
  let totalLevel = "SAFE", emoji = "🟢";
  if (avgScore < 80) { totalLevel = "AT RISK"; emoji = "🟠"; }
  if (avgScore < 50) { totalLevel = "CRITICAL"; emoji = "🔴"; }
  // AI narrative
  let breakdown = `Dealership "${dealership.company}" has an overall risk score of ${avgScore} (${totalLevel}). `;
  if (!visits.length) breakdown += "No customer visits on record. No actionable signal.";
  else {
    breakdown += `Out of ${visits.length} visits, ${visitScores.filter(s => s.riskLevel === "CRITICAL").length} were classified as CRITICAL and ${visitScores.filter(s => s.riskLevel === "AT RISK").length} as AT RISK. `;
    if (totalLevel !== "SAFE") breakdown += "Customer experience is not optimal. Recommend reviewing recent issues and following up with dissatisfied customers. ";
    else breakdown += "The dealership is performing well overall.";
  }
  // Suggestions
  const suggestions = [];
  if (!visits.length) { suggestions.push("Increase outreach to attract first customers."); }
  else if (totalLevel === "CRITICAL") { suggestions.push("Intensive QA, staff retraining, or management review immediately."); }
  else if (totalLevel === "AT RISK") { suggestions.push("Analyze negative visits, enhance positive factors, and engage proactively."); }
  else { suggestions.push("Keep up the high service standards!"); }
  // Most problematic visits
  const worstVisits = visits.map((v, i) => ({...v, ...visitScores[i]}))
    .filter(v => v.riskLevel !== "SAFE")
    .sort((a, b) => a.riskScore - b.riskScore)
    .slice(0,3);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/dealerships"
        sx={{ mb: 2 }}
      >
        Back to Dealerships
      </Button>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Dealership Analysis <BusinessIcon fontSize="inherit" style={{ verticalAlign:"middle" }} />
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {/* Summary info */}
          <Table>
            <TableBody>
              <TableRow>
                <TableCell><b>Company</b></TableCell>
                <TableCell>{dealership.company}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Email</b></TableCell>
                <TableCell>{dealership.email}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Location</b></TableCell>
                <TableCell>{dealership.address}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Total Visits</b></TableCell>
                <TableCell>{visits.length}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Average Risk Score</b></TableCell>
                <TableCell>
                  <Chip
                    label={avgScore}
                    color={totalLevel === "SAFE" ? "success" : totalLevel === "AT RISK" ? "warning" : "error"}
                    icon={totalLevel === "SAFE" ? <EmojiEmotionsIcon /> : totalLevel === "AT RISK" ? <WarningIcon /> : <ErrorIcon />}
                    sx={{ fontSize: 18 }}
                  /> &nbsp;{totalLevel} {emoji}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* Progress bar */}
          <Box sx={{ mt: 1, mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(avgScore, 100)}
              color={totalLevel === "SAFE" ? "success" : totalLevel === "AT RISK" ? "warning" : "error"}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: 15 }}>
            Dealership risk is aggregated from all visits, considering customer feedback, complaints, and service quality.
          </Typography>
          <Alert icon={false} severity="info" sx={{ mb: 2 }}>
            {breakdown}
          </Alert>
          <Typography variant="subtitle2" gutterBottom>Suggestions / Next Steps</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
            {suggestions.map(s => (
              <Chip label={s} color={s.includes("immediately") ? "error" : "primary"} key={s} />
            ))}
          </Stack>
          <Divider sx={{ mb: 2 }}/>
          <Typography variant="subtitle1" mb={1}>
            Visits with High Risk
          </Typography>
          {(!worstVisits.length) ? (
            <Typography color="textSecondary">No at-risk visits recently.</Typography>
          ) : (
            <List>
              {worstVisits.map((v) => (
                <ListItem key={v._id}>
                  <ListItemText
                    primary={
                      <b>{v.customerId?.name || "Anonymous Customer"}</b>
                    }
                    secondary={
                      <>
                        <span>
                          {v.visitDate?.slice(0,10)} | Rs. {v.price} | Feedback: {v.feedback?.feedbackProvided ? (v.feedback.stars + "★") : "None"}
                        </span>
                        <br/>
                        <Chip
                          label={`Score: ${v.riskScore} (${v.riskLevel})`}
                          color={v.riskLevel === "SAFE" ? "success" : v.riskLevel === "AT RISK" ? "warning" : "error"}
                          size="small"
                        />
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}