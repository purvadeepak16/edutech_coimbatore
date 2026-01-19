const mongoose = require("mongoose");

const memoryCardGameSchema = new mongoose.Schema({
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
  total_moves: {
    type: Number,
    required: true,
  },
  pairs_matched: {
    type: Number,
    required: true,
  },
  time_taken: {
    type: Number,
    required: true, // seconds
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
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
memoryCardGameSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("MemoryCardGame", memoryCardGameSchema, "memory_card_games");
