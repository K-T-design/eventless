
'use server';

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import type { UserProfile } from "@/types";

type PayoutDetails = {
    bankName: string;
    accountNumber: string;
    accountName: string;
}

export async function updatePayoutDetails(userId: string, details: PayoutDetails) {
  try {
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("User not found.");
    }
    
    const userProfile = userSnap.data() as UserProfile;
    if (userProfile.basicInfo.userType !== 'organizer') {
        throw new Error("Payouts can only be configured for organizers.");
    }

    await updateDoc(userRef, { 
      "orgInfo.bankDetails": details 
    });

    revalidatePath('/settings/payouts');

    return { success: true, message: `Payout details updated successfully.` };
  } catch (error: any) {
    console.error("Error updating payout details:", error);
    return { success: false, message: error.message || "Failed to update details." };
  }
}
