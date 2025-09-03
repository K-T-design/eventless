'use server';

import { firestore } from '@/lib/firebase-admin';
import type { UserProfile, Ticket } from '@/types';

export type OrganizerPayout = {
  organizerId: string;
  organizerName: string;
  ticketsSold: number;
  totalRevenue: number;
};

export async function getPendingPayouts(): Promise<{
  success: boolean;
  data?: OrganizerPayout[];
  message?: string;
}> {
  try {
    const organizers: { id: string; name: string }[] = [];
    const usersSnapshot = await firestore
      .collection('users')
      .where('basicInfo.userType', '==', 'organizer')
      .get();

    if (usersSnapshot.empty) {
      return { success: true, data: [] };
    }

    usersSnapshot.forEach((doc) => {
      const user = doc.data() as UserProfile;
      organizers.push({
        id: doc.id,
        name: user.basicInfo.name,
      });
    });
    
    const allPayouts: OrganizerPayout[] = [];

    for (const org of organizers) {
        const ticketsSnapshot = await firestore.collectionGroup('tickets')
            .where('eventDetails.organizerId', '==', org.id)
            .where('tier.price', '>', 0)
            .get();

        if (!ticketsSnapshot.empty) {
            let totalRevenue = 0;
            ticketsSnapshot.forEach(doc => {
                const ticket = doc.data() as Ticket;
                totalRevenue += ticket.tier.price;
            });

            if (totalRevenue > 0) {
                 allPayouts.push({
                    organizerId: org.id,
                    organizerName: org.name,
                    ticketsSold: ticketsSnapshot.size,
                    totalRevenue: totalRevenue,
                });
            }
        }
    }
    
    // For now, we are not filtering out past payouts. This will show all-time revenue.
    // A future implementation would involve a 'payouts' collection to track what has been paid.
    return { success: true, data: allPayouts.sort((a,b) => b.totalRevenue - a.totalRevenue) };
  } catch (error: any) {
    console.error('Error fetching pending payouts: ', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch payout data.',
    };
  }
}

// Denormalize organizerId into eventDetails when creating tickets
// This is a fix for the query above. We need to update the ticket creation logic.
// Find the ticket creation action file and add it. It's in checkout/[id]/actions.ts

