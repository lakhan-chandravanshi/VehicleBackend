// app.js
const express = require("express");
const cors= require('cors')
const app = express();
app.use(express.json());
app.use(cors())
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

module.exports = app;
