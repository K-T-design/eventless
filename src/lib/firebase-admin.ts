
import 'dotenv/config'; // Load environment variables
import admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Helper function to initialize and get the admin app
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    if (!serviceAccountString) {
         throw new Error('Firebase service account key is not defined. Please check your .env.local file.');
    }
    
    try {
       const serviceAccount = JSON.parse(serviceAccountString);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e) {
        console.error('Firebase Admin Initialization Error', e);
        // We re-throw the error to make it clear that initialization failed
        // and prevent the app from continuing in a broken state.
        throw new Error('Failed to initialize Firebase Admin SDK. Check the format of FIREBASE_SERVICE_ACCOUNT_KEY.');
    }
}

const adminApp = getFirebaseAdmin();

export const firestore = admin.firestore(adminApp);
export const auth = admin.auth(adminApp);
export const storage = admin.storage(adminApp);
