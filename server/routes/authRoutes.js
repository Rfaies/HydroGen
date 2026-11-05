const express = require('express')
const {
  googleLogin,
  getMe,
  logout
} = require('../controllers/authController')

const protect = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/google', googleLogin)
router.get('/me', protect, getMe)
router.post('/logout', protect, logout)

module.exports = router