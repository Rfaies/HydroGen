
const User = require('./models/User')
const WaterBody = require('./models/WaterBody')
const Device = require('./models/Device')
const Reading = require('./models/Reading')
const Alert = require('./models/Alert')

console.log('HydroGen database models loaded successfully!')

console.log([
  User.modelName,
  WaterBody.modelName,
  Device.modelName,
  Reading.modelName,
  Alert.modelName
])
