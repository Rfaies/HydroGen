
const WaterBody = require('../models/WaterBody')

// Add a water body
async function createWaterBody(req, res) {
  try {
    const { name, location, waterType } = req.body

    if (!name || !waterType) {
      return res.status(400).json({
        success: false,
        message: 'Name and water type are required'
      })
    }

    const waterBody = await WaterBody.create({
      userId: req.userId,
      name,
      location,
      waterType
    })

    return res.status(201).json({
      success: true,
      waterBody
    })
  } catch (error) {
    console.error('Create water body error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not create water body'
    })
  }
}

// Get all water bodies belonging to the logged-in user
async function getWaterBodies(req, res) {
  try {
    const waterBodies = await WaterBody.find({
      userId: req.userId
    }).sort({ createdAt: -1 })

    return res.json({
      success: true,
      waterBodies
    })
  } catch (error) {
    console.error('Get water bodies error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not fetch water bodies'
    })
  }
}
// Update a water body
async function updateWaterBody(req, res) {
  try {
    const { name, location, waterType } = req.body

    if (!name || !name.trim() || !waterType) {
      return res.status(400).json({
        success: false,
        message: 'Name and water type are required'
      })
    }

    const waterBody = await WaterBody.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      {
        name: name.trim(),
        location: location?.trim() || '',
        waterType
      },
      {
        new: true,
        runValidators: true
      }
    )

    if (!waterBody) {
      return res.status(404).json({
        success: false,
        message: 'Water body not found'
      })
    }

    return res.json({
      success: true,
      waterBody
    })
  } catch (error) {
    console.error('Update water body error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not update water body'
    })
  }
}

// Delete a water body
async function deleteWaterBody(req, res) {
  try {
    const waterBody = await WaterBody.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    })

    if (!waterBody) {
      return res.status(404).json({
        success: false,
        message: 'Water body not found'
      })
    }

    return res.json({
      success: true,
      message: 'Water body deleted successfully'
    })
  } catch (error) {
    console.error('Delete water body error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not delete water body'
    })
  }
}
module.exports = {
  createWaterBody,
  getWaterBodies,
  updateWaterBody,
  deleteWaterBody
}
