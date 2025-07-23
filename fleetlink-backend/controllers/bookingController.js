const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const { getEstimatedRideDuration } = require("../utils/rideEstimator");

exports.bookVehicle = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vehicleId, fromPincode, toPincode, startTime, customerId } = req.body;

    if (!vehicleId || !fromPincode || !toPincode || !startTime || !customerId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const vehicle = await Vehicle.findById(vehicleId).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const rideHours = getEstimatedRideDuration(fromPincode, toPincode);
    const start = new Date(startTime);
    const end = new Date(start);
    end.setHours(end.getHours() + rideHours);

    const conflict = await Booking.findOne({
      vehicleId,
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).session(session); // 👈 conflict check inside transaction

    if (conflict) {
      await session.abortTransaction();
      return res.status(409).json({ error: "🚫 Vehicle already booked for this time range." });
    }

    const booking = new Booking({
      vehicleId,
      fromPincode,
      toPincode,
      startTime: start,
      endTime: end,
      customerId
    });

    await booking.save({ session }); // 👈 save inside transaction
    await session.commitTransaction(); // ✅ Commit after everything is safe
    session.endSession();

    return res.status(201).json({ message: "✅ Vehicle booked successfully", booking });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Booking Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
