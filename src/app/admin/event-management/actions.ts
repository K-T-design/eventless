
'use server';

import { collection, getDocs, query, orderBy, where, getDoc, doc as firestoreDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Event, UserProfile, TicketTier } from "@/types";
import { revalidatePath } from "next/cache";

type EventWithDetails = Event & { 
  organizer?: UserProfile['basicInfo'];
  ticketTiers?: TicketTier[];
};

type EventFilters = {
    status: 'all' | 'pending' | 'approved' | 'rejected';
    university: string;
}

export async function getEvents(filters: EventFilters): Promise<EventWithDetails[]> {
  try {
    const eventsCollection = collection(firestore, "events");
    
    // Base query with ordering
    const queryConstraints = [orderBy("createdAt", "desc")];

    // Add status filter if not 'all'
    if (filters.status !== 'all') {
        queryConstraints.push(where("status", "==", filters.status));
    }
    
    // Add university filter if not 'all'
    if (filters.university !== 'all') {
        queryConstraints.push(where("university", "==", filters.university));
    }

    const q = query(eventsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const eventsList = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const event: Event = {
          id: docSnapshot.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Event;

        let organizerInfo: UserProfile['basicInfo'] | undefined;
        if (event.organizerId) {
          const userRef = firestoreDoc(firestore, 'users', event.organizerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            organizerInfo = (userSnap.data() as UserProfile).basicInfo;
          }
        }
        
        const tiersRef = collection(docSnapshot.ref, "ticketTiers");
        const tiersSnapshot = await getDocs(tiersRef);
        const ticketTiers = tiersSnapshot.docs.map(tierDoc => tierDoc.data() as TicketTier);

        return { ...event, organizer: organizerInfo, ticketTiers };
      })
    );
    
    return eventsList;
  } catch (error) {
    console.error("Error fetching events:", error);
    // Return empty array on error to prevent crashing the page
    return [];
  }
}


export async function updateEventStatus(eventId: string, newStatus: 'approved' | 'rejected' | 'pending') {
  try {
    const eventRef = firestoreDoc(firestore, "events", eventId);
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
