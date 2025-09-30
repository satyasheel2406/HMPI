// server/routes/sampleRoutes.js

const express = require('express');
const Sample = require('../models/Sample'); // Import the Sample model
const authMiddleware = require('../middleware/authMiddleware'); // Import our new middleware

const router = express.Router();

// ## CREATE A NEW SAMPLE ##
// Endpoint: POST /api/samples
// Protected: Yes
router.post('/', authMiddleware, async (req, res) => {
  try {
    // We get the sample data from the request body
    const { name, latitude, longitude, metals, hmpi, category, dominantMetal } = req.body;

    // We create a new sample, linking it to the logged-in user's ID
    // (req.user.id is added by our authMiddleware)
    const newSample = new Sample({
      user: req.user.id,
      name,
      latitude,
      longitude,
      metals,
      hmpi,
      category,
      dominantMetal,
    });

    const sample = await newSample.save();
    res.status(201).json(sample);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ## GET ALL SAMPLES FOR THE LOGGED-IN USER ##
// Endpoint: GET /api/samples
// Protected: Yes
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find all samples where the 'user' field matches the logged-in user's ID
    const samples = await Sample.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(samples);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;