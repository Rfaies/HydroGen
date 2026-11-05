
const mongoose = require('mongoose')

const waterBodySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      default: ''
    },

    waterType: {
      type: String,
      enum: ['Pond', 'Lake', 'River', 'Fish Farm', 'Other'],
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('WaterBody', waterBodySchema)
