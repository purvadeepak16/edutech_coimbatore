# Games Backend API

## Overview
Dedicated backend service for MindPlay games (Whack-a-Mole, Memory Card Game). Uses the same MongoDB instance as the main backend.

## Setup

### Installation
```bash
cd games-backend
npm install
```

### Environment Variables
Create a `.env` file in the `games-backend` directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
GAMES_PORT=5001
NODE_ENV=development
```

**Note:** Use the same `MONGODB_URI` as the main backend.

### Start Server
```bash
npm start        # Production
npm run dev      # Development with nodemon
```

Server runs on `http://localhost:5001` by default.

---

## API Endpoints

### Whack-a-Mole

#### Save Game Session
**POST** `/api/whack-a-mole/save`

Request body:
```json
{
  "clerk_user_id": "user_38L1RXexwDvHLfS25LBOnL7vJTy",
  "patient_id": "696a02cfbd082cc104a0f72e",
  "final_score": 42,
  "total_clicks": 50,
  "total_misses": 8,
  "accuracy": 84,
  "time_taken": 60,
  "peak_speed": 320,
  "avg_speed": 500,
  "status": "completed"
}
```

Response (201 Created):
```json
{
  "_id": "696a123abc...",
  "clerk_user_id": "user_38L1RXexwDvHLfS25LBOnL7vJTy",
  "final_score": 42,
  "accuracy": 84,
  "created_at": "2026-01-16T12:00:00.000Z"
}
```

#### Get Game History
**GET** `/api/whack-a-mole/history/:clerk_user_id?limit=8`

Response (200 OK):
```json
[
  {
    "_id": "696a123abc...",
    "final_score": 42,
    "accuracy": 84,
    "game_date": "2026-01-16T12:00:00.000Z"
  }
]
```

#### Get Game Statistics
**GET** `/api/whack-a-mole/stats/:clerk_user_id?days=30`

Response (200 OK):
```json
{
  "total_games": 5,
  "avg_score": 38.4,
  "max_score": 42,
  "min_score": 32,
  "avg_accuracy": 82.5
}
```

#### Delete Game Session
**DELETE** `/api/whack-a-mole/:gameId`

Response (200 OK):
```json
{
  "message": "Game session deleted successfully"
}
```

---

### Memory Card Game

#### Save Game Session
**POST** `/api/memory-card/save`

Request body:
```json
{
  "clerk_user_id": "user_38L1RXexwDvHLfS25LBOnL7vJTy",
  "patient_id": "696a02cfbd082cc104a0f72e",
  "final_matches": 8,
  "total_moves": 22,
  "best_moves": 20,
  "time_taken": 120,
  "best_time": 110,
  "accuracy": 88.5,
  "difficulty": "medium",
  "status": "completed"
}
```

#### Get Game History
**GET** `/api/memory-card/history/:clerk_user_id?limit=8`

#### Get Game Statistics
**GET** `/api/memory-card/stats/:clerk_user_id?days=30`

#### Delete Game Session
**DELETE** `/api/memory-card/:gameId`

---

## Database Collections

### whack_a_mole_games
- `clerk_user_id` (String, indexed)
- `final_score` (Number)
- `accuracy` (0-100 percentage)
- `total_clicks`, `total_misses` (Numbers)
- `game_date` (Date, indexed)

### memory_card_games
- `clerk_user_id` (String, indexed)
- `final_matches` (Number)
- `total_moves` (Number)
- `accuracy` (0-100 percentage)
- `game_date` (Date, indexed)

---

## Integration with Frontend

### Frontend Configuration
Set environment variable in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Frontend Example (Whack-a-Mole)
```typescript
const saveGame = async (score, clicks, misses) => {
  const response = await fetch(`${API_BASE_URL}/whack-a-mole/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clerk_user_id: user.id,
      final_score: score,
      total_clicks: clicks,
      total_misses: misses,
      accuracy: (score / (score + misses)) * 100,
      time_taken: 60,
      status: "completed"
    })
  });
};
```

---

## Development Notes

- Both Whack-a-Mole and Memory Card models follow the same pattern
- All timestamps are auto-managed (created_at, updated_at)
- Clerk user IDs are stored as strings (not ObjectIds)
- Optional patient_id field links to main backend's patients collection
- Aggregation pipelines used for efficiency in stats queries

