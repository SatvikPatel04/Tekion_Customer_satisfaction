import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Card, CardContent, Typography, Box, Chip, Stack, Divider, CircularProgress, Alert,
  Button, Container, Table, TableBody, TableCell, TableRow, LinearProgress, List, ListItem, ListItemText
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";

// Calculate the visit risk score (already good)
export function calculateVisitRiskScore(visit) {
  let score = 100;
  let positives = [];
  let riskFactors = [];
  if (visit.feedback?.stars >= 4) {
    score += 15; positives.push("High Customer Feedback");
  } else if (visit.feedback?.feedbackProvided) {
    score -= (4 - visit.feedback.stars) * 7;
    if (visit.feedback.stars <= 2) riskFactors.push("Low Customer Feedback");
  } else {
    riskFactors.push("No Feedback Provided");
    score -= 8;
  }
  if (visit.wasIssueResolved) { score += 12; positives.push("Issue Resolved"); }
  else { riskFactors.push("Issue Not Resolved"); score -= 20; }
  if (visit.serviceDelayInDays > 2) { score -= (visit.serviceDelayInDays - 2) * 4; riskFactors.push(`Service Delay: ${visit.serviceDelayInDays} days`);}
  else if (visit.serviceDelayInDays <= 1) { positives.push("Quick Service Turnaround"); }
  if (visit.price > 35000) { score -= Math.floor((visit.price - 35000)/2000); riskFactors.push("Unusually High Price"); }
  else if (visit.price < 15000) { positives.push("Good Price"); }
  if (visit.repeatIssues > 0) { riskFactors.push(`Repeat Issues: ${visit.repeatIssues}`); score -= visit.repeatIssues * 12;}
  else { positives.push("No Repeat Issues"); }
  score = Math.max(0, Math.min(130, score));
  let riskLevel = "SAFE", emoji = "🟢";
  if (score < 80) { riskLevel = "AT RISK"; emoji = "🟠"; }
  if (score < 50) { riskLevel = "CRITICAL"; emoji = "🔴"; }
  return { riskScore: score, riskLevel, emoji, positives, riskFactors };
}

export default function CustomerAnalysisPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [allVisits, setAllVisits] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    (async () => {
      try {
        const resCustomer = await axios.get(`http://localhost:5000/api/customers/${id}`);
        setCustomer(resCustomer.data);
        const resVisits = await axios.get(`http://localhost:5000/api/visits?customerId=${id}`);
        setAllVisits(Array.isArray(resVisits.data) ? resVisits.data : []);
      } catch (e) {
        setError("Could not fetch customer/visits.");
      }
    })();
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer) return <Box mt={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  // --- FIX: Ensure only this customer's visits are included, regardless of what the API returns ---
  const visits = allVisits.filter(
    v =>
      v.customerId === id ||
      v.customerId?._id === id || // in case .customerId is populated object
      v.customerId === customer._id ||
      (typeof v.customerId === 'object' && v.customerId?._id === customer._id)
  );

  // Aggregate stats
  const visitScores = visits.map(v => calculateVisitRiskScore(v));
  const riskSum = visitScores.reduce((a, s) => a + s.riskScore, 0);
  const avgScore = visitScores.length ? Math.round(riskSum / visitScores.length) : 0;
  let totalLevel = "SAFE", emoji = "🟢";
  if (avgScore < 80) { totalLevel = "AT RISK"; emoji = "🟠"; }
  if (avgScore < 50) { totalLevel = "CRITICAL"; emoji = "🔴"; }
  const recentRisks = visitScores.slice(-3).map(s => s.riskLevel);

  // AI/NL analysis
  let breakdown = `Customer "${customer.name}" has an average risk score of ${avgScore} (${totalLevel}). `;
  if (!visits.length) breakdown += "No visits on record for this customer. No actionable insight.";
  else {
    breakdown += `Across ${visits.length} visits, the most recent risk levels are: ${recentRisks.join(', ')}. `;
    if (totalLevel !== "SAFE") breakdown += "Customer engagement may be at risk, requiring follow-up and careful management. ";
    else breakdown += "This customer shows positive engagement and retention.";
  }

  // Suggestions
  const suggestions = [];
  if (!visits.length) { suggestions.push("No visits yet - reach out to get feedback!"); }
  else if (totalLevel === "CRITICAL") {
    suggestions.push("Contact customer for urgent satisfaction recovery.");
  } else if (totalLevel === "AT RISK") {
    suggestions.push("Initiate follow-up, review major issues, incentivize retention.");
  } else {
    suggestions.push("Maintain regular touchpoints and reward loyalty.");
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/customers"
        sx={{ mb: 2 }}
      >
        Back to Customers
      </Button>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Customer Analysis <PersonIcon fontSize="inherit" style={{ verticalAlign:"middle" }} />
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {/* Summary info */}
          <Table>
            <TableBody>
              <TableRow>
                <TableCell><b>Name</b></TableCell>
                <TableCell>{customer.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Email</b></TableCell>
                <TableCell>dummy@example.com</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Phone</b></TableCell>
                <TableCell>9876543210</TableCell>
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
                  />
                  &nbsp;{totalLevel} {emoji}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* Progress bar */}
          <Box sx={{ mt: 1, mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(avgScore,100)}
              color={totalLevel === "SAFE" ? "success" : totalLevel === "AT RISK" ? "warning" : "error"}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: 15 }}>
            Customer risk is calculated from all visits, based on feedback, repeat issues, price, and service experience.
          </Typography>
          {/* Narrative */}
          <Alert icon={false} severity="info" sx={{ mb: 2 }}>
            {breakdown}
          </Alert>
          <Typography variant="subtitle2" gutterBottom>Suggestions / Next Steps</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
            {suggestions.map(s => (
              <Chip label={s} color={s.includes("urgent") ? "error" : "primary"} key={s} />
            ))}
          </Stack>
          {/* Recent visits */}
          <Divider sx={{ mb: 2 }}/>
          <Typography variant="subtitle1" mb={1}>
            Recent Visits
          </Typography>
          {visits.length === 0 ? (
            <Typography color="textSecondary">No visits yet.</Typography>
          ) : (
            <List>
              {visits.slice(-3).reverse().map((visit, idx) => {
                const s = calculateVisitRiskScore(visit);
                return (
                  <ListItem key={visit._id}>
                    <ListItemText
                      primary={
                        <>
                          <b>{visit.dealershipId?.company || "Unknown Dealership"}</b> on {visit.visitDate?.slice(0,10)} —&nbsp;
                          <Chip
                            label={s.riskLevel}
                            color={s.riskLevel === "SAFE" ? "success" : s.riskLevel === "AT RISK" ? "warning" : "error"}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </>
                      }
                      secondary={
                        <>
                          Rs. {visit.price} | Feedback: {visit.feedback?.feedbackProvided ? (visit.feedback.stars + "★") : "None"} | Issue {visit.wasIssueResolved ? "Resolved" : "Unresolved"}
                        </>
                      }
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}