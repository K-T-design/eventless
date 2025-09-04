
'use server';

import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
// Use client SDK because this can be called from a client component page.
// The security check inside the function ensures authorization.
import { firestore } from '@/lib/firebase';
import type { Event, Ticket, UserProfile } from '@/types';

type Attendee = {
  ticketId: string;
  userName: string;
  userEmail: string;
  ticketTier: string;
  price: number;
  status: 'valid' | 'used';
  purchaseDate: Date;
};

export type EventDetailsData = {
  event: Event;
  stats: {
    ticketsSold: number;
    totalRevenue: number;
  };
  attendees: Attendee[];
};

export async function getEventDetailsForOrganizer(eventId: string, organizerId: string): Promise<EventDetailsData> {
  if (!eventId || !organizerId) {
    throw new Error("Event ID and Organizer ID are required.");
  }

  try {
    // 1. Fetch the event and verify ownership
    const eventRef = doc(firestore, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error("Event not found.");
    }

    const event = {
      id: eventSnap.id,
      ...eventSnap.data(),
      date: eventSnap.data().date.toDate(),
    } as Event;

    if (event.organizerId !== organizerId) {
      throw new Error("You are not authorized to view this event's details.");
    }

    // 2. Fetch all tickets for the event
    const ticketsRef = collection(firestore, 'tickets');
    const ticketsQuery = query(ticketsRef, where('eventId', '==', eventId), orderBy('purchaseDate', 'desc'));
    const ticketsSnapshot = await getDocs(ticketsQuery);

    const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
    
    // 3. Fetch user profiles for all attendees to get names/emails
    const userIds = [...new Set(tickets.map(t => t.userId))];
    const attendees: Attendee[] = [];
    
    if (userIds.length > 0) {
        // Firestore 'in' query is limited to 30 items. If more, we'd need to batch.
        const usersRef = collection(firestore, 'users');
        const usersQuery = query(usersRef, where('__name__', 'in', userIds));
        const usersSnapshot = await getDocs(usersQuery);
        const userProfiles = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as UserProfile['basicInfo']]));
        
        for (const ticket of tickets) {
            const userProfile = userProfiles.get(ticket.userId);
            attendees.push({
                ticketId: ticket.id,
                userName: userProfile?.name ?? "Unknown User",
                userEmail: userProfile?.email ?? "no-email@found.com",
                ticketTier: ticket.tier.name,
                price: ticket.tier.price,
                status: ticket.status,
                purchaseDate: ticket.purchaseDate,
            });
        }
    }


    // 4. Calculate stats
    const ticketsSold = tickets.length;
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.tier.price, 0);

    return {
      event,
      stats: {
        ticketsSold,
        totalRevenue,
      },
      attendees,
    };

  } catch (error) {
    console.error("Error fetching event details for organizer:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("Failed to fetch event details.");
  }
}
