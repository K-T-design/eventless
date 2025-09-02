
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// This function will be a Server Action
async function applyCorsConfiguration(): Promise<{success: boolean; message: string; bucketName?: string}> {
    'use server';
    
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


export default function ConfigureCorsPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{success: boolean; message: string; bucketName?: string} | null>(null);

    async function handleConfiguration() {
        setLoading(true);
        setResult(null);
        const response = await applyCorsConfiguration();
        setResult(response);
        setLoading(false);
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 text-center">
            <h1 className="text-3xl font-bold font-headline mb-4">Configure Storage CORS</h1>
            <p className="text-muted-foreground mb-8">
                Click the button below to apply the necessary CORS policy to your Firebase Storage bucket. This is a one-time setup to allow image uploads from the app.
            </p>

            <Alert variant="destructive" className="mb-8 text-left">
                <XCircle className="h-4 w-4"/>
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                    This is a powerful administrative action. Only run this if you are experiencing image upload errors related to CORS. The current policy will allow requests from `localhost:3000` and `localhost:9002`. You will need to update this for your production domain later.
                </AlertDescription>
            </Alert>


            <div className="bg-card p-8 rounded-lg shadow-sm border">
                <Button onClick={handleConfiguration} disabled={loading || result?.success} size="lg">
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {result?.success ? 'Configuration Complete' : 'Apply CORS Policy'}
                </Button>

                {result && (
                    <div className="mt-6 text-left">
                        {result.success ? (
                            <div className="flex items-center gap-3 p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
                                <CheckCircle className="h-6 w-6" />
                                <div>
                                    <h3 className="font-semibold">Success!</h3>
                                    <p className="text-sm">{result.message}</p>
                                    {result.bucketName && <p className="text-sm mt-1">Bucket: <code className="font-mono bg-green-100 p-1 rounded">{result.bucketName}</code></p>}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
                                <XCircle className="h-6 w-6" />
                                <div>
                                    <h3 className="font-semibold">Error</h3>
                                    <p className="text-sm">{result.message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
