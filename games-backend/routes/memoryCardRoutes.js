const express = require("express");
const router = express.Router();
const memoryCardController = require("../controllers/memoryCardController");

// Save a new game session
router.post("/save", memoryCardController.saveGameSession);

// Get user's game history
router.get("/history/:clerk_user_id", memoryCardController.getUserGameHistory);

// Get user's game statistics
router.get("/stats/:clerk_user_id", memoryCardController.getUserGameStats);

// Delete a game session
router.delete("/:gameId", memoryCardController.deleteGameSession);

module.exports = router;
