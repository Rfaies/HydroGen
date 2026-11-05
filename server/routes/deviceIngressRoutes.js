const express = require('express')
const authenticateDevice = require('../middleware/deviceAuthMiddleware')
const receiveTelemetry = require('../controllers/telemetryController')

const router = express.Router()

// Device-authenticated communication endpoint. Successful requests refresh lastSeen.
router.post('/heartbeat', authenticateDevice, (req, res) => {
  return res.json({
    success: true,
    deviceId: req.device.deviceId,
    lastSeen: req.device.lastSeen
  })
})

// Telemetry is validated and acknowledged but is not persisted in this feature.
router.post('/telemetry', authenticateDevice, receiveTelemetry)

module.exports = router
