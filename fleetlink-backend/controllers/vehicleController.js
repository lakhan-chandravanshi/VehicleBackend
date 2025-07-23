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

    // Parse startTime and validate
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: "Invalid startTime format. Use ISO format." });
    }

    // Calculate ride duration
    const rideHours = getEstimatedRideDuration(fromPincode, toPincode);
    const end = new Date(start);
    end.setHours(end.getHours() + rideHours);

    // Fetch all vehicles with sufficient capacity
    const allVehicles = await Vehicle.find({
      capacityKg: { $gte: parseInt(capacityRequired) },
    });

    // Find vehicle IDs that are already booked in the given time window
    const bookedVehicleIds = await Booking.find({
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).distinct("vehicleId");

    // Filter out booked vehicles
    const availableVehicles = allVehicles.filter(
      v => !bookedVehicleIds.includes(v._id.toString())
    );

    return res.json(availableVehicles);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
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