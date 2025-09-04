
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { Event, Ticket, TicketTier } from '@/types';
import { collection, query, where, getDocs, orderBy, collectionGroup } from 'firebase/firestore';

// Using client SDK because this will be called from a client component page.
// For sensitive ops, we'd use firebase-admin in a backend context.
import { firestore as clientFirestore } from '@/lib/firebase';

type EventWithStats = Event & {
  ticketsSold: number;
  revenue: number;
};

export type OrganizerDashboardData = {
  stats: {
    totalEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
  };
  events: EventWithStats[];
};

export async function getOrganizerDashboardData(organizerId: string): Promise<OrganizerDashboardData> {
  if (!organizerId) {
    throw new Error("Organizer ID is required.");
  }

  try {
    // 1. Fetch all events for the organizer
    const eventsRef = collection(clientFirestore, "events");
    const eventsQuery = query(
      eventsRef,
      where("organizerId", "==", organizerId),
      orderBy("createdAt", "desc")
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    
    const events: Event[] = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    } as Event));

    // 2. Fetch all tickets for all events of this organizer in one go
    const ticketsRef = collectionGroup(clientFirestore, 'tickets');
    const ticketsQuery = query(ticketsRef, where('eventDetails.organizerId', '==', organizerId));
    const ticketsSnapshot = await getDocs(ticketsQuery);
    const allTickets = ticketsSnapshot.docs.map(doc => doc.data() as Ticket);

    // 3. Process and aggregate data
    let totalTicketsSold = 0;
    let totalRevenue = 0;

    const eventsWithStats: EventWithStats[] = events.map(event => {
      const eventTickets = allTickets.filter(ticket => ticket.eventId === event.id);
      const ticketsSold = eventTickets.length;
      const revenue = eventTickets.reduce((sum, ticket) => sum + ticket.tier.price, 0);

      totalTicketsSold += ticketsSold;
      totalRevenue += revenue;
      
      return {
        ...event,
        ticketsSold,
        revenue,
      };
    });

    return {
      stats: {
        totalEvents: events.length,
        totalTicketsSold,
        totalRevenue,
      },
      events: eventsWithStats,
    };

  } catch (error) {
    console.error("Error fetching organizer dashboard data:", error);
    throw new Error("Failed to fetch dashboard data.");
  }
}
