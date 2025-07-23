const express = require("express");
const router = express.Router();
const { bookVehicle } = require("../controllers/bookingController");

router.post("/", bookVehicle);

module.exports = router;
