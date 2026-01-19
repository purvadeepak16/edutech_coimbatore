import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mindmapRoutes from "./routes/mindmap.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve service account either from env path or the checked-in file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.resolve(__dirname, '..', 'serviceAccount.json');

// Guard against missing/invalid credentials so auth endpoints fail fast
let serviceAccount;
try {
  const raw = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error('✗ Unable to read Firebase service account file:', err.message);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('✓ Firebase Admin initialized');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/mindmap", mindmapRoutes);
// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Verify Firebase ID token and return decoded claims
app.post('/api/auth/verify', async (req, res) => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized on server' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token, true);
    return res.json({ valid: true, uid: decoded.uid, claims: decoded });
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token', details: err.code || err.message });
  }
});

// Example protected route using token verification middleware
app.get('/api/protected', async (req, res) => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized on server' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token, true);
    return res.json({ message: 'Access granted', uid: decoded.uid });
  } catch (err) {
    console.error('Protected route token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Health check available at http://localhost:${PORT}/api/health`);
});
