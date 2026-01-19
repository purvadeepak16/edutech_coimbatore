const mongoose = require("mongoose");

const whackAMoleGameSchema = new mongoose.Schema({
  clerk_user_id: {
    type: String,
    required: true,
    index: true,
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    default: null,
  },
  final_score: {
    type: Number,
    required: true,
  },
  total_clicks: {
    type: Number,
    required: true,
  },
  total_misses: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  time_taken: {
    type: Number,
    required: true, // seconds
  },
  peak_speed: {
    type: Number,
    default: 0, // moles per second
  },
  avg_speed: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["completed", "abandoned", "timeout"],
    default: "completed",
  },
  game_date: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update updated_at before saving
whackAMoleGameSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("WhackAMoleGame", whackAMoleGameSchema, "whack_a_mole_games");
