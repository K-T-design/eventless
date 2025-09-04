
import 'dotenv/config'; // Load environment variables
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Helper function to initialize and get the admin app
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to be formatted correctly to handle newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error('Firebase Admin Error: Service account credentials are not fully defined in environment variables.');
        throw new Error('Firebase service account credentials are not defined. Please check your environment variables.');
    }
    
    try {
        console.log("Initializing Firebase Admin SDK...");
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized successfully.");
        return app;
    } catch (e: any) {
        console.error('Firebase Admin Initialization Error', e.message);
        // We re-throw the error to make it clear that initialization failed
        // and prevent the app from continuing in a broken state.
        throw new Error(`Failed to initialize Firebase Admin SDK. Check the format of your environment variables. Error: ${e.message}`);
    }
}

const adminApp = getFirebaseAdmin();

export const firestore = admin.firestore(adminApp);
export const auth = admin.auth(adminApp);
export const storage = admin.storage(adminApp);
