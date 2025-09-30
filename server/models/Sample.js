const mongoose = require('mongoose');

const SampleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // links sample to the User model
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    metals: {
      type: Object, // e.g. { Pb: 0.3, Cd: 0.1 }
      required: true,
    },
    hmpi: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    dominantMetal: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sample', SampleSchema);
