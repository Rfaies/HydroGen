const crypto = require('crypto')
const Device = require('../models/Device')
const WaterBody = require('../models/WaterBody')

// Register a Glob device
async function registerDevice(req, res) {
  try {
    const { deviceId, waterBodyId } = req.body

    // Validate required fields
    if (!deviceId || !waterBodyId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and water body are required'
      })
    }

    // Check whether the water body belongs to this user
    const waterBody = await WaterBody.findOne({
      _id: waterBodyId,
      userId: req.userId
    })

    if (!waterBody) {
      return res.status(404).json({
        success: false,
        message: 'Water body not found'
      })
    }

    // Create the device and assign it to the water body
   // Generate a unique secret for this device
const deviceCredential = crypto.randomBytes(32).toString('hex')

// Hash the credential before storing it
const credentialHash = crypto
  .createHash('sha256')
  .update(deviceCredential)
  .digest('hex')

// Create the device and assign it to the water body
const device = await Device.create({
  deviceId: deviceId.trim(),
  waterBodyId: waterBody._id,
  credentialHash
})

// Remove the hash from the response
const deviceResponse = device.toObject()
delete deviceResponse.credentialHash

   return res.status(201).json({
  success: true,
  message: 'Glob device registered successfully',
  device: deviceResponse,
  deviceCredential
  })
  } catch (error) {
    // Handle duplicate device IDs or water body assignments
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This device or water body already has an assignment'
      })
    }

    console.error('Device registration error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not register device'
    })
  }
}
// Get all devices belonging to the logged-in user
async function getDevices(req, res) {
  try {
    const waterBodies = await WaterBody.find({
      userId: req.userId
    }).select('_id')

    const waterBodyIds = waterBodies.map(
      (waterBody) => waterBody._id
    )

    const devices = await Device.find({
      waterBodyId: { $in: waterBodyIds }
    }).populate('waterBodyId', 'name')

    return res.json({
      success: true,
      devices
    })
  } catch (error) {
    console.error('Get devices error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not fetch devices'
    })
  }
}
module.exports = {
  registerDevice,
  getDevices
}