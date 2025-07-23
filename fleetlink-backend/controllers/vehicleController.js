const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const { getEstimatedRideDuration } = require("../utils/rideEstimator");

exports.addVehicle = async (req, res) => {
  const { name, capacityKg, tyres } = req.body;
  if (!name || !capacityKg || !tyres) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const vehicle = new Vehicle({ name, capacityKg, tyres });
  await vehicle.save();
  res.status(201).json(vehicle);
};

exports.getAvailableVehicles = async (req, res) => {
  try {
    const { capacityRequired, fromPincode, toPincode, startTime } = req.query;

    // Validate required fields
    if (!capacityRequired || !fromPincode || !toPincode || !startTime) {
      return res.status(400).json({ error: "Missing required query parameters." });
    }

    // Parse and validate startTime
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: "Invalid startTime format. Use ISO format." });
    }

    // Calculate estimated ride duration and end time
    const rideHours = getEstimatedRideDuration(fromPincode, toPincode);
    const end = new Date(start);
    end.setHours(end.getHours() + rideHours);

    // Step 1: Find vehicle IDs that are already booked in the time window
    const bookedVehicleIds = await Booking.find({
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).distinct('vehicleId');

    // Step 2: Fetch only vehicles with required capacity that are NOT booked
    const availableVehicles = await Vehicle.find({
      capacityKg: { $gte: parseInt(capacityRequired) },
      _id: { $nin: bookedVehicleIds }, // Exclude already booked
    });

    return res.status(200).json(availableVehicles);
  } catch (error) {
    console.error('Error fetching available vehicles:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.getAvailableNowVehicles = async (req, res) => {
  try {
    const now = new Date();

    // We'll assume bookings are active if current time is between start and end
    const activeBookings = await Booking.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).distinct("vehicleId");

    const availableVehicles = await Vehicle.find({
      _id: { $nin: activeBookings },
    });

    return res.status(200).json(availableVehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};