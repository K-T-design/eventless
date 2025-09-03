
import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount!),
    });
  } catch (e) {
    console.error('Firebase Admin Initialization Error', e);
  }
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
