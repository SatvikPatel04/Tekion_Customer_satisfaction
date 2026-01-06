const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  car: {
    model: { type: String, required: true },
    year: { type: Number, required: true },
    registrationNumber: { type: String, required: true },
  },
  dealershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealership', required: true },
});

module.exports = mongoose.model('Customer', customerSchema);