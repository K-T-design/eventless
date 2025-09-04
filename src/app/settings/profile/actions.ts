
'use server';

import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase-admin"; // Use admin SDK for security on backend operations
import { revalidatePath } from "next/cache";

type ProfileDetails = {
    name: string;
    phone: string;
}

export async function updateProfileDetails(userId: string, details: ProfileDetails) {
  try {
    const userRef = doc(firestore, "users", userId);
   
    await updateDoc(userRef, { 
      "basicInfo.name": details.name,
      "basicInfo.phone": details.phone,
    });

    revalidatePath('/settings/profile');

    return { success: true, message: `Profile details updated successfully.` };
  } catch (error: any) {
    console.error("Error updating profile details:", error);
    return { success: false, message: error.message || "Failed to update details." };
  }
}


type SubscriptionDetails = {
    reference: string;
    planType: string;
    durationDays: number;
}

export async function updateUserSubscription(userId: string, details: SubscriptionDetails) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack secret key is not configured.");
    }
    
    try {
        // 1. Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${details.reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!data.status || data.data.status !== 'success') {
            throw new Error(data.message || 'Payment verification failed.');
        }

        // 2. Update user document in Firestore
        const userRef = doc(firestore, "users", userId);
        
        const now = new Date();
        const expiryDate = new Date(now.setDate(now.getDate() + details.durationDays));

        await updateDoc(userRef, {
            "subscription.status": "active",
            "subscription.planType": details.planType,
            "subscription.expiryDate": Timestamp.fromDate(expiryDate),
            "subscription.freeEventsUsed": 0, // Reset free event counter upon subscribing
        });

        revalidatePath('/settings/profile');
        revalidatePath('/create-event');
        
        return { success: true, message: "Subscription updated successfully." };

    } catch (error: any) {
        console.error("Error updating user subscription:", error);
        return { success: false, message: error.message || "Failed to update subscription." };
    }
}
