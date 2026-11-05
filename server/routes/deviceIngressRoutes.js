const express = require('express')
const authenticateDevice = require('../middleware/deviceAuthMiddleware')

const router = express.Router()

// Device-authenticated communication endpoint. Successful requests refresh lastSeen.
router.post('/heartbeat', authenticateDevice, (req, res) => {
  return res.json({
    success: true,
    deviceId: req.device.deviceId,
    lastSeen: req.device.lastSeen
  })
})

module.exports = router
