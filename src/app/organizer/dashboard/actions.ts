
'use server';

import type { Event, Ticket } from '@/types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  collectionGroup,
  Timestamp 
} from 'firebase/firestore';
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
    
    const events: Event[] = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Event;
    });

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
      const revenue = eventTickets.reduce((sum, ticket) => sum + (ticket.tier?.price || 0), 0);

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

  } catch (error: any) {
    console.error("Error fetching organizer dashboard data:", error);
    // Return a more specific error message
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }
}
