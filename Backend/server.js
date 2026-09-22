require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const userRoutes = require("./Routes/users/UserRoutes");
const vaccineRoutes = require("./Routes/vaccineCatalog/VaccineRoutes");
const doseRoutes = require("./Routes/vaccineCatalog/DoseRoutes");
const appointmentRoutes = require("./Routes/Appointment/AppointmentRoutes");
const clinicRoutes = require("./Routes/Appointment/ClinicRoutes");
const authMiddleware = require("./middlewares/auth.middleware");  // Placeholder for JWT/role check
const immunizationLogRoutes = require("./Routes/ImmunizationLogs/immunizationLog.routes");  // New route for immunization logs

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://uni-vax.vercel.app"
  ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any Vercel deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "UniVax Backend API", 
    version: "1.0.0",
    status: "running"
  });
});

// Routes
app.use("/api/V1/users", userRoutes);
app.use("/api/V1/vaccines", vaccineRoutes);
app.use("/api/V1/doses", doseRoutes);
app.use("/api/V1/appointments", appointmentRoutes);
app.use("/api/V1/clinics", clinicRoutes);
app.use("/api/V1/logs",immunizationLogRoutes)  // Register immunization log routes

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

// Only connect and start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  if (!MONGO_URI) {
    console.error("✗ MONGO_URI is not defined in .env file");
    process.exit(1);
  }

  // Connect to MongoDB and start server
  mongoose
    .connect(MONGO_URI) 
    .then(() => {
      console.log("✓ Connected to MongoDB");
      app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("✗ Database connection failed:", err.message);
      process.exit(1);
    });
}

module.exports = app;

