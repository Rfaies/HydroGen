
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const waterBodyRoutes = require('./routes/waterBodyRoutes')
const deviceRoutes = require('./routes/deviceRoutes')
const deviceIngressRoutes = require('./routes/deviceIngressRoutes')
const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/water-bodies', waterBodyRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/device', deviceIngressRoutes)
app.use('/api/water-bodies', waterBodyRoutes)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HydroGen backend is running!'
  })
})

const PORT = process.env.PORT || 5000

async function startServer() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`HydroGen server running on http://localhost:${PORT}`)
  })
}

startServer()

