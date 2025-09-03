
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { SupportTicket } from '@/types';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Using the client SDK for this server action as it will be called from a client component.
// For more sensitive operations, firebase-admin would be used.
import { firestore as clientFirestore } from '@/lib/firebase';

export async function getSupportTickets(): Promise<{ success: boolean, data?: SupportTicket[], message?: string }> {
  try {
    const ticketsRef = collection(clientFirestore, "supportTickets");
    const q = query(ticketsRef, orderBy("submittedAt", "desc"));
    const querySnapshot = await getDocs(q);

    const tickets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt.toDate(),
            resolvedAt: data.resolvedAt ? data.resolvedAt.toDate() : undefined,
        } as SupportTicket;
    });
    
    return { success: true, data: tickets };
  } catch (error: any) {
    console.error("Error fetching support tickets:", error);
    return { success: false, message: error.message || "Failed to fetch tickets." };
  }
}

export async function updateTicketStatus(ticketId: string, status: SupportTicket['status']) {
  try {
    const ticketRef = doc(clientFirestore, "supportTickets", ticketId);
    const updateData: { status: string, resolvedAt?: any } = { status };
    if (status === 'closed') {
        updateData.resolvedAt = serverTimestamp();
    }
    await updateDoc(ticketRef, updateData);

    return { success: true, message: "Ticket status updated." };
  } catch (error: any) {
    console.error("Error updating ticket status:", error);
    return { success: false, message: error.message || "Failed to update ticket." };
  }
}
