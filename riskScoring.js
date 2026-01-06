// --- Sample hardcoded visit data --- //

// --- Baselines and Weights --- //
const BASE_PRICE = 5000;
const MAX_DELAY_DAYS = 30;
const MAX_REPEAT_ISSUES = 2; // Max for penalty
const MAX_FEEDBACK_STARS = 5;

const WEIGHTS = {
  delay: 0.2,
  price: 0.25,
  feedback: 0.2,
  repeat: 0.2,
  resolution: 0.15
};

const visits = [
  {
    id: 1,
    customerName: "Rahul Sharma",
    car: { model: "Swift", year: 2019, registrationNumber: "MH12AB1234" },
    dealership: "AutoWorld",
    visitDate: "2024-05-10",
    serviceDelayInDays: 2,      // Days late vs reminder
    price: 4950,                // Service bill (Rupees)
    feedback: { stars: 5, feedbackProvided: true },
    repeatIssues: 0,            // Number of repeated issues in recent visits
    wasIssueResolved: true
  },
  {
    id: 2,
    customerName: "Priya Desai",
    car: { model: "Baleno", year: 2020, registrationNumber: "DL8CAF5678" },
    dealership: "DriveMax",
    visitDate: "2024-05-20",
    serviceDelayInDays: 18,
    price: 6100,
    feedback: { stars: 2, feedbackProvided: true },
    repeatIssues: 2,
    wasIssueResolved: false
  },
  {
    id: 3,
    customerName: "Sahil Khan",
    car: { model: "Creta", year: 2018, registrationNumber: "KA01HG3456" },
    dealership: "MegaMotors",
    visitDate: "2024-06-01",
    serviceDelayInDays: 30,
    price: 4500,
    feedback: { stars: null, feedbackProvided: false }, // No feedback
    repeatIssues: 1,
    wasIssueResolved: true
  }
  // You can add more sample visits here if you like!
];

console.log("Sample visit data loaded:", visits);



function calculateVisitRiskScore(visit) {
  // Signal calculations
  const delayScore = Math.min(visit.serviceDelayInDays, MAX_DELAY_DAYS) / MAX_DELAY_DAYS;
  const priceShock = Math.abs(visit.price - BASE_PRICE) / BASE_PRICE;
  const priceScore = Math.min(priceShock, 1); // Capped at 1

  let feedbackRaw; let feedbackExplanation;
  if (!visit.feedback.feedbackProvided) {
    feedbackRaw = 0.5; // Neutral penalty for silence
    feedbackExplanation = `No feedback provided (treated as risk)`;
  } else {
    feedbackRaw = visit.feedback.stars / MAX_FEEDBACK_STARS;
    feedbackExplanation = `${visit.feedback.stars} stars out of 5`;
  }
  const feedbackScore = 1 - feedbackRaw; // Lower stars = higher risk

  const repeatScore = Math.min(visit.repeatIssues, MAX_REPEAT_ISSUES) / MAX_REPEAT_ISSUES;

  const resolutionScore = visit.wasIssueResolved ? 0 : 1; // 1 if unresolved, 0 if resolved

  // Weighted sum (higher sum = more risk)
  const riskSum =
    WEIGHTS.delay * delayScore +
    WEIGHTS.price * priceScore +
    WEIGHTS.feedback * feedbackScore +
    WEIGHTS.repeat * repeatScore +
    WEIGHTS.resolution * resolutionScore;

  // Final score, 0-100
  const finalScore = Math.round(Math.max(0, Math.min(1, riskSum)) * 100);

  // Color coding
  let riskLevel, riskColor;
  if (finalScore <= 30) {
    riskLevel = 'SAFE';
    riskColor = '🟢';
  } else if (finalScore <= 60) {
    riskLevel = 'AT RISK';
    riskColor = '🟡';
  } else {
    riskLevel = 'CRITICAL';
    riskColor = '🔴';
  }

  // Explanations for each signal
  const explanation = [
    `--- Risk Analysis for Visit ID: ${visit.id} (${visit.customerName}, ${visit.car.model}) ---`,
    `Overall Visit Risk Score: ${finalScore} / 100 ${riskColor}   (${riskLevel})`,
    "",
    `Breakdown by factor:`,
    `• Service Delay: ${visit.serviceDelayInDays} days late`,
    `    ⇒ Score: ${(delayScore * 100).toFixed(1)}/100, Weight: ${WEIGHTS.delay * 100}%`,
    `• Price Shock: ₹${visit.price} billed (baseline ₹${BASE_PRICE})`,
    `    ⇒ Score: ${(priceScore * 100).toFixed(1)}/100, Weight: ${WEIGHTS.price * 100}%`,
    `• Feedback: ${feedbackExplanation}`,
    `    ⇒ Score: ${(feedbackScore * 100).toFixed(1)}/100, Weight: ${WEIGHTS.feedback * 100}%`,
    `• Repeat Issues: ${visit.repeatIssues} recent repeat(s)`,
    `    ⇒ Score: ${(repeatScore * 100).toFixed(1)}/100, Weight: ${WEIGHTS.repeat * 100}%`,
    `• Issue Resolution: ${visit.wasIssueResolved ? "Resolved" : "Unresolved"}`,
    `    ⇒ Score: ${(resolutionScore * 100).toFixed(1)}/100, Weight: ${WEIGHTS.resolution * 100}%`,
    "",
    "Explanation:",
    `- ${visit.serviceDelayInDays > 10 ? "High delay in service increases disengagement risk." : "Service was mostly on time."}`,
    `- ${priceScore > 0.2 ? "Significant price shock could cause dissatisfaction." : "Price close to baseline—low risk."}`,
    `- ${!visit.feedback.feedbackProvided ? "No feedback increases silent churn risk." : (visit.feedback.stars < 3 ? "Low feedback reflects dissatisfaction." : "Feedback is positive.")}`,
    `- ${visit.repeatIssues > 0 ? "Repeat problems indicate unresolved issues." : "No repeat issues reported."}`,
    `- ${visit.wasIssueResolved ? "Issue was resolved—positive." : "Unresolved issue sharply increases risk."}`,
    ""
  ].join('\n');

  return { finalScore, riskLevel, riskColor, explanation };
}



visits.forEach(v => {
  const result = calculateVisitRiskScore(v);
  console.log(result.explanation);
});