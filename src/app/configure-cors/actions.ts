
'use server';

// This function will be a Server Action
export async function applyCorsConfiguration(): Promise<{success: boolean; message: string; bucketName?: string}> {
    // In a real environment, you might need to install and import these
    // but in Firebase Studio, the admin SDK should be available.
    const admin = require('firebase-admin');
    
    try {
        // Initialize the app if it's not already initialized
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        
        const storage = admin.storage();
        const bucket = storage.bucket(); // Gets the default bucket

        const corsConfiguration = [
            {
                "origin": ["http://localhost:3000", "http://localhost:9002"],
                "method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
                "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
                "maxAgeSeconds": 3600
            }
        ];

        await bucket.setCorsConfiguration(corsConfiguration);

        return { 
            success: true, 
            message: 'CORS policy has been successfully applied.',
            bucketName: bucket.name
        };

    } catch (error: any) {
        console.error("Error applying CORS configuration:", error);
        return { 
            success: false, 
            message: `An error occurred: ${error.message}` 
        };
    }
}
