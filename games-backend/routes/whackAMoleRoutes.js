const express = require("express");
const router = express.Router();
const whackAMoleController = require("../controllers/whackAMoleController");

// Save a new game session
router.post("/save", whackAMoleController.saveGameSession);

// Get user's game history
router.get("/history/:clerk_user_id", whackAMoleController.getUserGameHistory);

// Get user's game statistics
router.get("/stats/:clerk_user_id", whackAMoleController.getUserGameStats);

// Delete a game session
router.delete("/:gameId", whackAMoleController.deleteGameSession);

module.exports = router;
