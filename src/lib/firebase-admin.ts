
import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

// Helper function to initialize and get the admin app
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount!),
        });
    } catch (e) {
        console.error('Firebase Admin Initialization Error', e);
        // We re-throw the error to make it clear that initialization failed
        // and prevent the app from continuing in a broken state.
        throw new Error('Failed to initialize Firebase Admin SDK.');
    }
}

const adminApp = getFirebaseAdmin();

export const firestore = admin.firestore(adminApp);
export const auth = admin.auth(adminApp);
export const storage = admin.storage(adminApp);
