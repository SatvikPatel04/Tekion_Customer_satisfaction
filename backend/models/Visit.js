const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  dealershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealership', required: true },
  visitDate: { type: Date, required: true },
  serviceDelayInDays: { type: Number, required: true },
  price: { type: Number, required: true },
  feedback: {
    stars: { type: Number, min: 1, max: 5 },  // can be null
    feedbackProvided: { type: Boolean, required: true }
  },
  repeatIssues: { type: Number, required: true },
  wasIssueResolved: { type: Boolean, required: true }
});

module.exports = mongoose.model('Visit', visitSchema);