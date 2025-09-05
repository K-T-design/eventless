
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { firestore } from '@/lib/firebase';
import type { UserProfile, SupportTicket } from "@/types";
import { getCurrentUser } from "@/lib/auth";


type CreateTicketInput = {
  subject: string;
  message: string;
  category: SupportTicket['category'];
}

export async function createSupportTicket(input: CreateTicketInput): Promise<{ success: boolean, message?: string }> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("You must be logged in to create a ticket.");
    }
    const userId = user.uid;

  try {
    // We need the user's name from their profile
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("User profile not found.");
    }

    const userProfile = userSnap.data() as UserProfile;

    const newTicket = {
        ...input,
        userId: userId,
        userEmail: userProfile.basicInfo.email,
        userName: userProfile.basicInfo.name,
        status: 'open' as const,
        submittedAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, "supportTickets"), newTicket);

    return { success: true };
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return { success: false, message: error.message || "Failed to create ticket." };
  }
}
