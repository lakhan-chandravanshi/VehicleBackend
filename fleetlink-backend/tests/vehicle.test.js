// tests/vehicle.test.js
require("dotenv").config();
jest.setTimeout(10000);

const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await Vehicle.deleteMany(); // test data clear
  await mongoose.disconnect();
});

describe("POST /api/vehicles", () => {
  it("should create a vehicle", async () => {
    const res = await request(app).post("/api/vehicles").send({
      name: "Truck X",
      capacityKg: 1000,
      tyres: 6,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("name", "Truck X");
  });
});
