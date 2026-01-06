// ------- SAMPLE DATA ------- //
const dealerships = [
  { _id: 1, company: "DriveMax", uniqueName: "drivemax", address: "City Center" },
  { _id: 2, company: "AutoWorld", uniqueName: "autoworld", address: "Main Street" }
];

const customers = [
  { _id: 101, name: "Rahul Sharma", car: { model: "Swift", year: 2019, registrationNumber: "MH12AB1234" }, dealershipId: 2 },
  { _id: 102, name: "Priya Desai", car: { model: "Baleno", year: 2020, registrationNumber: "DL8CAF5678" }, dealershipId: 1 },
  { _id: 103, name: "Sahil Khan", car: { model: "Creta", year: 2018, registrationNumber: "KA01HG3456" }, dealershipId: 1 }
];

const visits = [
  // Rahul Sharma, AutoWorld
  { id: 1, customerId: 101, dealershipId: 2, visitDate: "2024-01-15", serviceDelayInDays: 2, price: 4900, feedback: { stars: 5, feedbackProvided: true }, repeatIssues: 0, wasIssueResolved: true },
  { id: 2, customerId: 101, dealershipId: 2, visitDate: "2024-04-10", serviceDelayInDays: 4, price: 5000, feedback: { stars: 4, feedbackProvided: true }, repeatIssues: 0, wasIssueResolved: true },
  { id: 3, customerId: 101, dealershipId: 2, visitDate: "2024-06-01", serviceDelayInDays: 3, price: 5100, feedback: { stars: 5, feedbackProvided: true }, repeatIssues: 0, wasIssueResolved: true },

  // Priya Desai, DriveMax
  { id: 4, customerId: 102, dealershipId: 1, visitDate: "2023-12-12", serviceDelayInDays: 15, price: 6200, feedback: { stars: 2, feedbackProvided: true }, repeatIssues: 1, wasIssueResolved: false },
  { id: 5, customerId: 102, dealershipId: 1, visitDate: "2024-03-18", serviceDelayInDays: 22, price: 6100, feedback: { stars: null, feedbackProvided: false }, repeatIssues: 2, wasIssueResolved: false },

  // Sahil Khan, DriveMax
  { id: 7, customerId: 103, dealershipId: 1, visitDate: "2024-02-15", serviceDelayInDays: 10, price: 4500, feedback: { stars: 5, feedbackProvided: true }, repeatIssues: 0, wasIssueResolved: true },
  { id: 8, customerId: 103, dealershipId: 1, visitDate: "2024-04-25", serviceDelayInDays: 16, price: 4700, feedback: { stars: null, feedbackProvided: false }, repeatIssues: 1, wasIssueResolved: true }
];

// ------- BASELINES/WEIGHTS ------- //
const BASE_PRICE = 5000;
const MAX_DELAY_DAYS = 30;
const MAX_REPEAT_ISSUES = 2;
const MAX_FEEDBACK_STARS = 5;

const WEIGHTS = {
  delay: 0.2,
  price: 0.25,
  feedback: 0.2,
  repeat: 0.2,
  resolution: 0.15
};

// ------- SCORING FN: Per Visit ------- //
function calculateVisitRiskScore(visit, customer) {
  const delayScore = Math.min(visit.serviceDelayInDays, MAX_DELAY_DAYS) / MAX_DELAY_DAYS;
  const priceShock = Math.abs(visit.price - BASE_PRICE) / BASE_PRICE;
  const priceScore = Math.min(priceShock, 1);
  let feedbackRaw, feedbackExplanation;
  if (!visit.feedback.feedbackProvided) {
    feedbackRaw = 0.5;
    feedbackExplanation = `No feedback provided (treated as risk)`;
  } else {
    feedbackRaw = visit.feedback.stars / MAX_FEEDBACK_STARS;
    feedbackExplanation = `${visit.feedback.stars} stars out of 5`;
  }
  const feedbackScore = 1 - feedbackRaw;
  const repeatScore = Math.min(visit.repeatIssues, MAX_REPEAT_ISSUES) / MAX_REPEAT_ISSUES;
  const resolutionScore = visit.wasIssueResolved ? 0 : 1;

  const riskSum =
    WEIGHTS.delay * delayScore +
    WEIGHTS.price * priceScore +
    WEIGHTS.feedback * feedbackScore +
    WEIGHTS.repeat * repeatScore +
    WEIGHTS.resolution * resolutionScore;

  const finalScore = Math.round(Math.max(0, Math.min(1, riskSum)) * 100);

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

  const explanation = [
    `--- Visit Risk Score ---`,
    `Customer: ${customer.name} (${customer.car.model}) | Visit Date: ${visit.visitDate}`,
    `Risk Score: ${finalScore}/100 ${riskColor} (${riskLevel})`,
    "",
    `Breakdown:`,
    `• Service Delay: ${visit.serviceDelayInDays} days late (Score: ${(delayScore*100).toFixed(1)}/100, Weight: ${WEIGHTS.delay*100}%)`,
    `• Price Shock: ₹${visit.price} (Score: ${(priceScore*100).toFixed(1)}/100, Weight: ${WEIGHTS.price*100}%)`,
    `• Feedback: ${feedbackExplanation} (Score: ${(feedbackScore*100).toFixed(1)}/100, Weight: ${WEIGHTS.feedback*100}%)`,
    `• Repeat Issues: ${visit.repeatIssues} (Score: ${(repeatScore*100).toFixed(1)}/100, Weight: ${WEIGHTS.repeat*100}%)`,
    `• Issue Resolution: ${visit.wasIssueResolved ? "Resolved" : "Unresolved"} (Score: ${(resolutionScore*100).toFixed(1)}/100, Weight: ${WEIGHTS.resolution*100}%)`,
    ""
  ].join('\n');

  return { finalScore, riskLevel, riskColor, explanation };
}

// ------- SCORING FN: Dealership Experience for Customer ------- //
function calculateDealershipExperienceScore(customer, allVisits) {
  const visits = allVisits.filter(v => v.customerId === customer._id);
  if (!visits.length) return { finalScore: 0, riskLevel: 'CRITICAL', riskColor: '🔴', explanation: "No visits recorded." };

  // Calculate stats across visits
  const visitScores = visits.map(v => calculateVisitRiskScore(v, customer));
  const avgVisitScore = visitScores.reduce((sum, s) => sum + s.finalScore, 0) / visitScores.length;
  const lastVisit = visits[visits.length-1];
  const now = new Date();
  const daysSinceLastVisit = Math.floor((now - new Date(lastVisit.visitDate)) / (1000 * 60 * 60 * 24));
  const avgFeedback = visits.reduce((sum, v) => sum + ((v.feedback.stars || 0)), 0) / visits.length;
  const feedbackMissingCount = visits.filter(v => !v.feedback.feedbackProvided).length;
  const repeatIssuesTotal = visits.reduce((sum, v) => sum + (v.repeatIssues || 0), 0);
  const unresolvedVisits = visits.filter(v => !v.wasIssueResolved).length;
  const avgDelay = visits.reduce((sum, v) => sum + v.serviceDelayInDays, 0) / visits.length;

  // Normalization
  const normAvgDelay = Math.min(avgDelay, MAX_DELAY_DAYS) / MAX_DELAY_DAYS;
  const normAvgVisitScore = avgVisitScore / 100;
  const normFeedback = 1 - (avgFeedback / MAX_FEEDBACK_STARS);
  const normMissingFeedback = Math.min(feedbackMissingCount / visits.length, 1);
  const normRepeat = Math.min(repeatIssuesTotal / (visits.length * MAX_REPEAT_ISSUES), 1);
  const normUnresolved = Math.min(unresolvedVisits / visits.length, 1);
  const normLastVisitGap = Math.min(daysSinceLastVisit, 180) / 180;

  const weights = {
    avgDelay: 0.18,
    avgVisitScore: 0.2,
    feedback: 0.18,
    feedbackMissing: 0.12,
    repeat: 0.12,
    unresolved: 0.12,
    lastVisitGap: 0.08
  };

  const riskSum =
      weights.avgDelay*normAvgDelay +
      weights.avgVisitScore*normAvgVisitScore +
      weights.feedback*normFeedback +
      weights.feedbackMissing*normMissingFeedback +
      weights.repeat*normRepeat +
      weights.unresolved*normUnresolved +
      weights.lastVisitGap*normLastVisitGap;

  const finalScore = Math.round(Math.max(0, Math.min(1, riskSum)) * 100);

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

  const explanation = [
    `--- Dealership Experience Risk for ${customer.name} (${customer.car.model}) ---`,
    `Risk Score: ${finalScore}/100 ${riskColor} (${riskLevel})`,
    "",
    `Breakdown:`,
    `- Average Visit Risk: ${avgVisitScore.toFixed(1)}/100 (last visit: ${lastVisit.visitDate})`,
    `- Average Service Delay: ${avgDelay.toFixed(1)} days`,
    `- Average Feedback: ${isNaN(avgFeedback) ? "No feedback" : avgFeedback.toFixed(1) + "/5"}`,
    `- Visits with No Feedback: ${feedbackMissingCount}/${visits.length}`,
    `- Total Repeat Issues: ${repeatIssuesTotal}`,
    `- Unresolved Visits: ${unresolvedVisits}/${visits.length}`,
    `- Days Since Last Visit: ${daysSinceLastVisit}`,
    ""
  ].join('\n');

  return { finalScore, riskLevel, riskColor, explanation };
}

// ------- NEW: Per-customer Dealership Experiences ------- //
function getPerCustomerDealershipExperiences(dealershipId) {
  const dealership = dealerships.find(d => d._id === dealershipId);
  if (!dealership) throw new Error("Dealership not found");

  // Get customers belonging to this dealership
  const customersForDealership = customers.filter(c => c.dealershipId === dealershipId);

  // For each customer, calculate their dealership experience score/explanation
  return customersForDealership.map(customer => {
    const result = calculateDealershipExperienceScore(customer, visits);
    return {
      customer,
      ...result
    };
  });
}

// ------- NEW: Overall Dealership Experience ------- //
function getOverallDealershipExperience(dealershipId) {
  const perCustomer = getPerCustomerDealershipExperiences(dealershipId);

  if (!perCustomer.length) {
    return {
      avgScore: 0,
      riskLevel: "CRITICAL",
      riskColor: "🔴",
      explanation: `No customers or visits recorded for this dealership so far.`
    };
  }

  const avgScore = perCustomer.reduce((sum, c) => sum + c.finalScore, 0) / perCustomer.length;

  let riskLevel, riskColor;
  if (avgScore <= 30) {
    riskLevel = 'SAFE';
    riskColor = '🟢';
  } else if (avgScore <= 60) {
    riskLevel = 'AT RISK';
    riskColor = '🟡';
  } else {
    riskLevel = 'CRITICAL';
    riskColor = '🔴';
  }

  // Compose a natural language summary!
  const safeCount = perCustomer.filter(c => c.riskLevel === 'SAFE').length;
  const riskCount = perCustomer.filter(c => c.riskLevel === 'AT RISK').length;
  const criticalCount = perCustomer.filter(c => c.riskLevel === 'CRITICAL').length;

  const explanation = [
    `=== Overall Dealership Experience for ${dealerships.find(d => d._id === dealershipId).company} ===`,
    `Average Risk Score (all customers): ${avgScore.toFixed(1)}/100 ${riskColor} (${riskLevel})`,
    `Customer Risk Breakdown: SAFE: ${safeCount}, AT RISK: ${riskCount}, CRITICAL: ${criticalCount}`,
    "",
    ...(perCustomer.map(c =>
      `→ ${c.customer.name}: ${c.finalScore}/100 ${c.riskColor} (${c.riskLevel})`
    )),
    "",
    avgScore <= 30
      ? "Most customers have low risk scores, which means consistently good dealership experiences."
      : avgScore <= 60
      ? "Customer experiences are average, with warning signs for some customers. Attention needed on delays, repeat issues, or feedback."
      : "Many customers are at high risk — frequent delays, unresolved issues, or unsatisfactory feedback are causing bad experiences.",
    ""
  ].join("\n");

  return {
    avgScore,
    riskLevel,
    riskColor,
    explanation
  };
}

// ------- DEMO: Print Experiences for All Dealerships ------- //
function printDealershipOverview(dealershipId) {
  const dealership = dealerships.find(d => d._id === dealershipId);
  console.log(`\n########################`);
  console.log(`#  ${dealership.company}`);
  console.log(`########################\n`);

  

  console.log("\n### OVERALL DEALERSHIP EXPERIENCE ###\n");
  const overall = getOverallDealershipExperience(dealershipId);
  console.log(overall.explanation);
}

// Print for both dealerships:
printDealershipOverview(1);
printDealershipOverview(2);