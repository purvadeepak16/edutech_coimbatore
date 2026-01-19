require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dbConfig = require("./config/database");

// Routes
const whackAMoleRoutes = require("./routes/whackAMoleRoutes");
const memoryCardRoutes = require("./routes/memoryCardRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(dbConfig.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✓ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/whack-a-mole", whackAMoleRoutes);
app.use("/api/memory-card", memoryCardRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Games backend is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = dbConfig.port;

app.listen(PORT, () => {
  console.log(`🎮 Games Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 API Base: http://localhost:${PORT}/api`);
  console.log(`   - Whack-a-Mole: /api/whack-a-mole`);
  console.log(`   - Memory Card: /api/memory-card`);
});

module.exports = app;
