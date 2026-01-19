import express from 'express';

const router = express.Router();

// In-memory storage
// In a real app, use a database (MongoDB/PostgreSQL)
// survivors: Map<id, { name, day, stats, status, decisions }>
const survivors = new Map();
let leaderboard = [
    { name: "Survivor_One", score: 1250, days: 14, survived: true },
    { name: "Zombie_Bait", score: 800, days: 8, survived: false },
    { name: "Lucky_Runner", score: 1100, days: 12, survived: false }
];

// Helper: Calculate score
const calculateScore = (survivor) => {
    return (survivor.day * 100) +
        (survivor.stats.health * 2) +
        (survivor.stats.morale * 2) +
        (survivor.stats.curiosity || 0);
};

// POST /survivors - Create a new survivor
router.post('/survivors', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const id = Date.now().toString();
        const newSurvivor = {
            id,
            name,
            day: 1,
            status: 'alive', // alive, dead, escaped
            stats: {
                health: 100,
                hunger: 80, // Lower is better? No, let's say 100 is full (not hungry) specific logic might vary
                // Let's stick to: Higher is better for all for simplicity in this MVP, 
                // OR follow context: Hunger usually: 0 = starving, 100 = full. 
                // Let's assume standard "Health bar" logic: 100 is good.
                morale: 100,
                shelter: 50,
                allies: 0
            },
            history: []
        };

        survivors.set(id, newSurvivor);
        res.status(201).json({ survivor: newSurvivor, message: "Good luck, survivor." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /survivors/:id/decisions - Make a decision for a day
router.post('/survivors/:id/decisions', (req, res) => {
    try {
        const { id } = req.params;
        const { decision } = req.body; // 'shelter', 'food', 'allies', 'rest'

        const survivor = survivors.get(id);
        if (!survivor) return res.status(404).json({ error: "Survivor not found" });

        if (survivor.status !== 'alive') {
            return res.status(400).json({ error: "Game over", survivor });
        }

        // Game Logic
        let message = "";
        const rng = Math.random();

        // Daily degradation
        survivor.stats.hunger = Math.max(0, survivor.stats.hunger - 10);
        survivor.stats.shelter = Math.max(0, survivor.stats.shelter - 5);

        switch (decision) {
            case 'shelter':
                survivor.stats.shelter = Math.min(100, survivor.stats.shelter + 25);
                survivor.stats.hunger = Math.max(0, survivor.stats.hunger - 5); // Consumes energy
                message = "You reinforced your defenses. The zombies scratched at the door all night, but you felt safer.";
                break;
            case 'food':
                if (rng > 0.3) {
                    survivor.stats.hunger = Math.min(100, survivor.stats.hunger + 30);
                    message = "You found a stash of canned beans! A feast for a king.";
                } else {
                    survivor.stats.health = Math.max(0, survivor.stats.health - 15);
                    message = "It was a trap! You tripped an alarm and had to run, escaping with a scratch.";
                }
                break;
            case 'allies':
                if (rng > 0.6) {
                    survivor.stats.allies += 1;
                    survivor.stats.morale = Math.min(100, survivor.stats.morale + 20);
                    message = "You found a lost soul wandering the streets. You are not alone anymore.";
                } else {
                    survivor.stats.morale = Math.max(0, survivor.stats.morale - 15);
                    message = "You searched for hours but found only ghosts of the past. It's lonely out here.";
                }
                break;
            case 'rest':
                survivor.stats.health = Math.min(100, survivor.stats.health + 10);
                survivor.stats.morale = Math.min(100, survivor.stats.morale + 10);
                message = "You took a day to recover. Focus is key to survival.";
                break;
            default:
                message = "You hesitated... and lost precious time.";
                survivor.stats.morale -= 5;
        }

        // Check Vital Signs
        if (survivor.stats.health <= 0) {
            survivor.status = 'dead';
            message += " You succumbed to your injuries.";
        } else if (survivor.stats.hunger <= 0) {
            survivor.status = 'dead';
            message += " You starved to death.";
        } else if (survivor.stats.shelter <= 0 && rng < 0.2) {
            survivor.status = 'dead';
            message += " Your shelter collapsed during the night raid. You didn't make it.";
        }

        // Advance Day
        if (survivor.status === 'alive') {
            survivor.day += 1;
            if (survivor.day > 14) {
                survivor.status = 'escaped';
                message = "Day 15: The rescue helicopter spotted your flare! You made it out alive!";
            }
        }

        // Calculate Score
        survivor.score = calculateScore(survivor);

        // Update History
        survivor.history.push({ day: survivor.day - 1, decision, stats: { ...survivor.stats }, message });

        res.json({ survivor, message });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /leaderboard
router.get('/leaderboard', (req, res) => {
    // Sort by score desc
    const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
    res.json({ leaderboard: sorted });
});

// POST /leaderboard
router.post('/leaderboard', (req, res) => {
    const { name, score, days, survived } = req.body;
    if (!name || score === undefined) return res.status(400).json({ error: "Invalid data" });

    leaderboard.push({ name, score, days, survived });
    // Keep top 50
    if (leaderboard.length > 50) {
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 50);
    }

    res.json({ success: true, leaderboard });
});

export default router;
