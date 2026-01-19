import { admin as firebaseAdmin } from './firebaseAdmin.js';

if (!firebaseAdmin) {
  throw new Error('Firebase Admin SDK not initialized. Ensure FIREBASE_SERVICE_ACCOUNT is set or FIREBASE_SERVICE_ACCOUNT_PATH points to a valid file.');
}

const admin = firebaseAdmin;
const db = admin.firestore();

export default admin;
export { db };
