const MemoryCardGame = require("../models/MemoryCardGame");

// Save a game session
exports.saveGameSession = async (req, res) => {
  try {
    const { clerk_user_id, patient_id, final_score, total_moves, pairs_matched, time_taken, difficulty, status } = req.body;

    if (!clerk_user_id || final_score === undefined || total_moves === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const gameSession = new MemoryCardGame({
      clerk_user_id,
      patient_id,
      final_score,
      total_moves,
      pairs_matched,
      time_taken,
      difficulty,
      status: status || "completed",
    });

    const saved = await gameSession.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error saving memory card game session:", error);
    res.status(500).json({ error: "Failed to save game session" });
  }
};

// Get user's game history
exports.getUserGameHistory = async (req, res) => {
  try {
    const { clerk_user_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    if (!clerk_user_id) {
      return res.status(400).json({ error: "clerk_user_id is required" });
    }

    const history = await MemoryCardGame.find({ clerk_user_id })
      .sort({ game_date: -1 })
      .limit(limit);

    res.json(history);
  } catch (error) {
    console.error("Error fetching memory card game history:", error);
    res.status(500).json({ error: "Failed to fetch game history" });
  }
};

// Get user's game statistics
exports.getUserGameStats = async (req, res) => {
  try {
    const { clerk_user_id } = req.params;
    const days = parseInt(req.query.days) || 30;

    if (!clerk_user_id) {
      return res.status(400).json({ error: "clerk_user_id is required" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await MemoryCardGame.aggregate([
      {
        $match: {
          clerk_user_id,
          game_date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total_games: { $sum: 1 },
          avg_score: { $avg: "$final_score" },
          max_score: { $max: "$final_score" },
          min_score: { $min: "$final_score" },
          avg_moves: { $avg: "$total_moves" },
          total_pairs_matched: { $sum: "$pairs_matched" },
        },
      },
    ]);

    res.json(stats.length > 0 ? stats[0] : { message: "No games found in the specified period" });
  } catch (error) {
    console.error("Error fetching memory card game stats:", error);
    res.status(500).json({ error: "Failed to fetch game statistics" });
  }
};

// Delete a game session
exports.deleteGameSession = async (req, res) => {
  try {
    const { gameId } = req.params;

    const deleted = await MemoryCardGame.findByIdAndDelete(gameId);

    if (!deleted) {
      return res.status(404).json({ error: "Game session not found" });
    }

    res.json({ message: "Game session deleted successfully" });
  } catch (error) {
    console.error("Error deleting memory card game session:", error);
    res.status(500).json({ error: "Failed to delete game session" });
  }
};
