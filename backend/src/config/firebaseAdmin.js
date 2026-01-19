import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Firebase Admin SDK using either a JSON string or a local file path.
// Do NOT commit service account JSON to the repository. Use environment variables
// or a secret manager in production.

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) return admin.app();

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  let credentialObj = null;

  if (serviceAccountJson) {
    try {
      credentialObj = JSON.parse(serviceAccountJson);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err.message);
      throw err;
    }
  } else if (serviceAccountPath) {
    // Try a few candidate locations for the provided path to be resilient in dev setups
    const candidates = [];
    // If an absolute path was provided, try it first
    candidates.push(serviceAccountPath);
    // Relative to current working directory
    candidates.push(path.resolve(process.cwd(), serviceAccountPath));
    // Common alternative: serviceAccount in ./src folder
    candidates.push(path.resolve(process.cwd(), 'src', path.basename(serviceAccountPath)));
    // Relative to this module file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    candidates.push(path.resolve(__dirname, '..', path.basename(serviceAccountPath)));
    candidates.push(path.resolve(__dirname, path.basename(serviceAccountPath)));

    let readErr = null;
    for (const p of candidates) {
      if (!p) continue;
      try {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          credentialObj = JSON.parse(raw);
          serviceAccountPath = p; // update to actual path used
          break;
        }
      } catch (err) {
        readErr = err;
      }
    }

    if (!credentialObj) {
      console.error('Failed to read or parse service account file. Tried paths:', candidates);
      if (readErr) console.error(readErr.message || readErr);
      throw new Error('Service account file not found or invalid');
    }
  } else {
    console.warn('No Firebase service account provided via env; Firebase Admin not initialized.');
    return null;
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(credentialObj),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });

  console.log('Firebase Admin initialized.');
  return app;
}

const firebaseApp = initFirebaseAdmin();

export { firebaseApp, admin };
