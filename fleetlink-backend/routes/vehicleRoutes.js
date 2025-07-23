const express = require("express");
const router = express.Router();
const { addVehicle, getAvailableVehicles,getAvailableNowVehicles } = require("../controllers/vehicleController");

router.post("/", addVehicle);
router.get("/available", getAvailableVehicles);
router.get("/available-now",getAvailableNowVehicles);

module.exports = router;
