
'use server';

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

type PayoutDetails = {
    bankName: string;
    accountNumber: string;
    accountName: string;
}

export async function updatePayoutDetails(userId: string, details: PayoutDetails) {
  try {
    const userRef = doc(firestore, "users", userId);
    
    await updateDoc(userRef, { 
      "bankDetails": details 
    });

    revalidatePath('/settings/payouts');

    return { success: true, message: `Payout details updated successfully.` };
  } catch (error: any) {
    console.error("Error updating payout details:", error);
    return { success: false, message: error.message || "Failed to update details." };
  }
}
