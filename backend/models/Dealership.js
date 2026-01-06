const mongoose = require('mongoose');

const dealershipSchema = new mongoose.Schema({
  company: { type: String, required: true },
  uniqueName: { type: String, required: true },
  address: { type: String, required: true },
});

module.exports = mongoose.model('Dealership', dealershipSchema);