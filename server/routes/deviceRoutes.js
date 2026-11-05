const express = require('express')

const {
  registerDevice,
  getDevices
} = require('../controllers/deviceController')
const protect = require('../middleware/authMiddleware')

const router = express.Router()

// All device routes require authentication
router.use(protect)

// Register a Glob device
router.post('/register', registerDevice)
router.get('/', getDevices)

module.exports = router