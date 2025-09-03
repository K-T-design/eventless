
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types';

export type OrganizerPayout = {
  organizerId: string;
  organizerName: string;
  payoutDue: number;
  bankDetails: UserProfile['orgInfo']['bankDetails'];
};

export async function getPendingPayouts(): Promise<{
  success: boolean;
  data?: OrganizerPayout[];
  message?: string;
}> {
  try {
    const payouts: OrganizerPayout[] = [];
    
    // Simple query to get all organizers with a pending balance.
    const usersSnapshot = await firestore
      .collection('users')
      .where('basicInfo.userType', '==', 'organizer')
      .where('orgInfo.payouts.balance', '>', 0)
      .get();

    if (usersSnapshot.empty) {
      return { success: true, data: [] };
    }

    usersSnapshot.forEach((doc) => {
      const user = doc.data() as UserProfile;
      if (user.orgInfo) {
        payouts.push({
            organizerId: doc.id,
            organizerName: user.basicInfo.name,
            payoutDue: user.orgInfo.payouts.balance,
            bankDetails: user.orgInfo.bankDetails,
        });
      }
    });
    
    return { success: true, data: payouts.sort((a,b) => b.payoutDue - a.payoutDue) };
  } catch (error: any) {
    console.error('Error fetching pending payouts: ', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch payout data.',
    };
  }
}
