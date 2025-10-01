import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import logger from './logger';
import path from 'path';

// Firebase configuration
const firebaseConfig = {
  projectId: process.env['FIREBASE_PROJECT_ID'] || 'benalsam-2025',
  databaseURL: process.env['FIREBASE_DATABASE_URL'] || 'https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app'
};

// Service Account Key path
const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');

// Initialize Firebase Admin SDK
let app: any;
let database: any;
let auth: any;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    // Try to load service account from file first
    try {
      const serviceAccount = require(serviceAccountPath);
      app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: firebaseConfig.databaseURL
      });
      logger.info('✅ Firebase Admin SDK initialized with service account file');
    } catch (fileError) {
      // Fallback to environment variables
      logger.warn('⚠️ Service account file not found, using environment variables');
      app = initializeApp({
        credential: cert({
          projectId: process.env['FIREBASE_PROJECT_ID'] || '',
          privateKey: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n') || '',
          clientEmail: process.env['FIREBASE_CLIENT_EMAIL'] || ''
        }),
        databaseURL: firebaseConfig.databaseURL
      });
      logger.info('✅ Firebase Admin SDK initialized with environment variables');
    }
  } else {
    app = getApps()[0];
    logger.info('✅ Firebase Admin SDK already initialized');
  }

  // Initialize Firebase services
  database = getDatabase(app);
  auth = getAuth(app);

  logger.info('✅ Firebase Realtime Database initialized');
  logger.info('✅ Firebase Auth initialized');

} catch (error) {
  logger.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { app, database, auth };
export default { app, database, auth };
