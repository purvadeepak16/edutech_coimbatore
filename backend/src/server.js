import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env early
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from the frontend dev server by default
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Dynamically import Firebase admin and route modules after env is loaded
// so firebase initialization reads .env correctly.
await import('./config/firebaseAdmin.js');
const studyGroupsRoutes = (await import('./routes/studyGroups.routes.js')).default;

// Mount API routes
app.use('/api/study-groups', studyGroupsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Health check available at http://localhost:${PORT}/api/health`);
});
