
'use server';

import { doc, updateDoc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import type { Payout } from "@/types";

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

export async function getPayoutHistoryForUser(userId: string): Promise<{
  success: boolean;
  data?: Payout[];
  message?: string;
}> {
  try {
    const historySnapshot = await getDocs(
      query(
        collection(firestore, "payouts"),
        where("organizerId", "==", userId),
        orderBy("payoutDate", "desc")
      )
    );

    if (historySnapshot.empty) {
      return { success: true, data: [] };
    }

    const history = historySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            payoutDate: data.payoutDate.toDate(),
        } as Payout;
    })

    return { success: true, data: history };
  } catch (error: any) {
     console.error('Error fetching payout history: ', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch payout history.',
    };
  }
}
