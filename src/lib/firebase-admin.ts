
import 'dotenv/config'; // Load environment variables
import admin from 'firebase-admin';

// Helper function to initialize and get the admin app
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to be formatted correctly to handle newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase service account credentials are not defined. Please check your .env.local file.');
    }
    
    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e) {
        console.error('Firebase Admin Initialization Error', e);
        // We re-throw the error to make it clear that initialization failed
        // and prevent the app from continuing in a broken state.
        throw new Error('Failed to initialize Firebase Admin SDK. Check the format of your environment variables.');
    }
}

const adminApp = getFirebaseAdmin();

export const firestore = admin.firestore(adminApp);
export const auth = admin.auth(adminApp);
export const storage = admin.storage(adminApp);
