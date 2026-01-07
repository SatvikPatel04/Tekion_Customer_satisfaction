const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Dealership = require('./models/Dealership');
const Customer = require('./models/Customer');
const Visit = require('./models/Visit');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// POST: Create one dealership
app.post('/api/dealerships', async (req, res) => {
  try {
    const dealership = new Dealership(req.body);
    const saved = await dealership.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Get all dealerships
app.get('/api/dealerships', async (req, res) => {
  try {
    const dealerships = await Dealership.find();
    res.json(dealerships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get one dealership by ID
app.get('/api/dealerships/:id', async (req, res) => {
  try {
    const dealership = await Dealership.findById(req.params.id);
    if (!dealership) return res.status(404).json({ error: "Not found" });
    res.json(dealership);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create one customer
app.post('/api/customers', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    const saved = await customer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().populate('dealershipId');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get one customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('dealershipId');
    if (!customer) return res.status(404).json({ error: "Not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST: Create one visit
app.post('/api/visits', async (req, res) => {
  try {
    const visit = new Visit(req.body);
    const saved = await visit.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Get all visits
app.get('/api/visits', async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate('customerId')
      .populate('dealershipId');
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get one visit by ID
app.get('/api/visits/:id', async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('customerId')
      .populate('dealershipId');
    if (!visit) return res.status(404).json({ error: "Not found" });
    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const mongoUri = "mongodb+srv://221210103_db_user:tekion123@cluster0.irq1zk8.mongodb.net/carServiceDB?retryWrites=true&w=majority";

if (!mongoUri) {
  console.error('MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch(err => console.error(err));