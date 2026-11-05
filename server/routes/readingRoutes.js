const express = require('express')
const { getReadings } = require('../controllers/readingController')
const protect = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)
router.get('/', getReadings)

module.exports = router
