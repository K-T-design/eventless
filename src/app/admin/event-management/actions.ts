
'use server';

import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

export async function updateEventStatus(eventId: string, newStatus: 'approved' | 'rejected' | 'pending') {
  try {
    const eventRef = doc(firestore, "events", eventId);
    await updateDoc(eventRef, { status: newStatus });

    // Revalidate relevant paths to reflect changes immediately
    revalidatePath('/admin/event-management');
    revalidatePath('/discover');
    revalidatePath(`/events/${eventId}`);

    return { success: true, message: `Event status updated to ${newStatus}.` };
  } catch (error: any) {
    console.error("Error updating event status:", error);
    return { success: false, message: error.message || "Failed to update event status." };
  }
}
