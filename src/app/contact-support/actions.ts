
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { firestore, auth } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth';
import type { UserProfile, SupportTicket } from "@/types";

type CreateTicketInput = {
  subject: string;
  message: string;
  category: SupportTicket['category'];
}

export async function createSupportTicket(input: CreateTicketInput): Promise<{ success: boolean, message?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("You must be logged in to create a ticket.");
    }
    
    // We need the user's name from their profile
    const userRef = doc(firestore, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("User profile not found.");
    }

    const userProfile = userSnap.data() as UserProfile;

    const newTicket = {
        ...input,
        userId: user.uid,
        userEmail: userProfile.basicInfo.email,
        userName: userProfile.basicInfo.name,
        status: 'open',
        submittedAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, "supportTickets"), newTicket);

    return { success: true };
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return { success: false, message: error.message || "Failed to create ticket." };
  }
}
