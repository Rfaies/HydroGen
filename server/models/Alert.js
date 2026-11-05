
const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema(
  {
    waterBodyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterBody',
      required: true,
      index: true
    },

    deviceId: {
      type: String,
      required: true
    },

    parameter: {
      type: String,
      enum: ['ammonia', 'temperature', 'salinity', 'pH'],
      required: true
    },

    value: {
      type: Number,
      required: true
    },

    threshold: {
      type: Number,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Alert', alertSchema)
