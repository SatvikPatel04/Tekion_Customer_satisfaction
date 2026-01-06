import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Card, CardContent, Typography, Box, Chip, Stack, Divider, CircularProgress, Alert, Button,
  Tooltip, Container, Table, TableBody, TableCell, TableRow, LinearProgress
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import StarIcon from '@mui/icons-material/Star';

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function daysAgo(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

// Dummy scoring function (enhanced sample)
function calculateVisitRiskScore(visit) {
  // Example scoring, replace per your baseline
  let score = 100;
  const positives = [];
  const riskFactors = [];

  // Feedback
  if (visit.feedback?.stars >= 4) {
    score += 15; positives.push("High Customer Feedback");
  } else if (visit.feedback?.feedbackProvided) {
    score -= (4 - visit.feedback.stars) * 7;
    if (visit.feedback.stars <= 2) riskFactors.push("Low Customer Feedback");
  } else {
    riskFactors.push("No Feedback Provided");
    score -= 8;
  }

  // Issue resolved?
  if (visit.wasIssueResolved) {
    score += 12; positives.push("Issue Resolved");
  } else {
    riskFactors.push("Issue Not Resolved"); score -= 20;
  }

  // Service delay
  if (visit.serviceDelayInDays > 2) {
    score -= (visit.serviceDelayInDays - 2) * 4;
    riskFactors.push(`Service Delay: ${visit.serviceDelayInDays} days`);
  } else if (visit.serviceDelayInDays <= 1) {
    positives.push("Quick Service Turnaround");
  }

  // Price
  if (visit.price > 35000) {
    score -= Math.floor((visit.price - 35000) / 2000); // -1 per Rs 2k above threshold
    riskFactors.push("Unusually High Price");
  } else if (visit.price < 15000) {
    positives.push("Good Price");
  }

  // Repeat Issues
  if (visit.repeatIssues > 0) {
    riskFactors.push(`Repeat Issues: ${visit.repeatIssues}`);
    score -= visit.repeatIssues * 12;
  } else {
    positives.push("No Repeat Issues");
  }

  // Clamp, then set Level
  score = Math.max(0, Math.min(130, score));
  let riskLevel = "SAFE", emoji = "🟢";
  if (score < 80) { riskLevel = "AT RISK"; emoji = "🟠"; }
  if (score < 50) { riskLevel = "CRITICAL"; emoji = "🔴"; }
  
  // AI Narrative
  let breakdown = `The visit is assessed at a risk score of ${score} (${riskLevel}). 
    ${positives.length ? `Strengths include: ${positives.join(", ")}. ` : ""}
    ${riskFactors.length ? `Concerns: ${riskFactors.join("; ")}.` : ""}
    Overall, this visit ${riskLevel === "SAFE" ? "shows satisfactory engagement." : 
       riskLevel === "AT RISK" ? "requires attention to improve retention." : 
       "is problematic and requires urgent action."}
  `;

  // Suggestions
  const suggestions = [];
  if (riskFactors.includes("Issue Not Resolved")) suggestions.push("Address unresolved issue immediately.");
  if (riskFactors.find(f => f.startsWith("Service Delay"))) suggestions.push("Consider compensatory measure for delay.");
  if (riskFactors.includes("No Feedback Provided")) suggestions.push("Reach out for detailed feedback.");
  if (positives.includes("No Repeat Issues")) suggestions.push("Maintain quick, quality service to uphold satisfaction.");
  if (riskLevel === "SAFE") suggestions.push("No immediate action required.");
  if (riskLevel === "CRITICAL") suggestions.push("Management intervention recommended.");

  return {
    riskScore: score,
    riskLevel,
    emoji,
    positives,
    riskFactors,
    breakdown,
    suggestions,
  };
}

export default function VisitAnalysisPage() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState();

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/visits/${id}`);
        setVisit(res.data);
      } catch (e) {
        setError("Could not fetch visit.");
      }
    };
    fetchVisit();
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!visit) return <Box mt={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  const analysis = calculateVisitRiskScore(visit);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/visits"
        sx={{ mb: 2 }}
      >
        Back to Visits
      </Button>

      <Card elevation={4} sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Visit Risk Analysis {analysis.emoji}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box mb={4}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell><b>Date of Visit</b></TableCell>
                  <TableCell>{formatDate(visit.visitDate)} <span style={{ color: "#888", fontSize: 12 }}>({daysAgo(visit.visitDate)})</span></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Customer</b></TableCell>
                  <TableCell>{visit.customerId?.name || "-"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Dealership</b></TableCell>
                  <TableCell>{visit.dealershipId?.company || "-"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Service Delay</b></TableCell>
                  <TableCell>{visit.serviceDelayInDays} days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Ticket Price</b></TableCell>
                  <TableCell>₹{visit.price?.toLocaleString() || "-"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Feedback</b></TableCell>
                  <TableCell>
                    {visit.feedback?.feedbackProvided
                      ? <>
                          <Stack direction="row" spacing={1} alignItems="center" component="span" display="inline-flex">
                            <Chip color="primary" icon={<StarIcon />} size="small" label={`${visit.feedback.stars} / 5`} />
                            {visit.feedback.comment ? <em style={{ color: "#666" }}>"{visit.feedback.comment}"</em> : null}
                          </Stack>
                        </>
                      : <i>No feedback provided</i>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Issue Resolved</b></TableCell>
                  <TableCell>
                    <Chip
                      label={visit.wasIssueResolved ? "Yes" : "No"}
                      color={visit.wasIssueResolved ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Repeat Issues</b></TableCell>
                  <TableCell>
                    <Chip
                      label={visit.repeatIssues === 0 ? "None" : visit.repeatIssues}
                      color={visit.repeatIssues === 0 ? "success" : "warning"}
                      size="small"
                      variant={visit.repeatIssues === 0 ? "outlined" : "filled"}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Tooltip title={`Risk score: ${analysis.riskScore}`}>
              <Chip
                label={`${analysis.riskScore}`}
                color={analysis.riskLevel === "SAFE" ? "success"
                  : (analysis.riskLevel === "AT RISK" ? "warning" : "error")}
                size="large"
                icon={
                  analysis.riskLevel === "SAFE"
                    ? <EmojiEmotionsIcon />
                    : (analysis.riskLevel === "AT RISK"
                      ? <WarningIcon />
                      : <ErrorIcon />)
                }
                sx={{ fontSize: 22, height: 48, px: 2 }}
              />
            </Tooltip>
            <Typography variant="body1" fontWeight={600} sx={{ minWidth: 120 }}>
              {analysis.riskLevel} &nbsp; {analysis.emoji}
            </Typography>
            {/* Progress bar for visual effect */}
            <Box flex={1} ml={2}>
              <LinearProgress
                variant="determinate"
                value={Math.min(analysis.riskScore, 100)}
                color={
                  analysis.riskLevel === "SAFE" ? "success"
                    : (analysis.riskLevel === "AT RISK" ? "warning" : "error")
                }
                sx={{ height: 10, borderRadius: 4 }}
              />
            </Box>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 3, ml: 1, fontSize: 15 }}>
            Risk score is based on recent feedback, repeat visits, price paid, service delay & issue resolution.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" color="success.main" mb={1}>What went right</Typography>
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            {analysis.positives.length
              ? analysis.positives.map(f => (
                <Chip label={f} color="success" key={f} />))
              : <Chip label="No positives detected" variant="outlined"/>}
          </Stack>

          <Typography variant="subtitle1" color="error.main" mb={1}>What went wrong</Typography>
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            {analysis.riskFactors.length
              ? analysis.riskFactors.map(f => (
                <Chip label={f} color="error" key={f} />))
              : <Chip label="No major risks" variant="outlined"/>}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" gutterBottom>AI-Style Analysis</Typography>
          <Alert icon={false} severity="info" sx={{ mb: 2 }}>
            {analysis.breakdown}
          </Alert>

          <Typography variant="subtitle2" gutterBottom>Suggestions / Next Steps</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
            {analysis.suggestions.map(s => (
              <Chip label={s} color={s.includes("immediate") || s.includes("urgent") ? "error" : "primary"} key={s} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}