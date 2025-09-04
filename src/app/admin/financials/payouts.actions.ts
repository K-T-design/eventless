
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { UserProfile, Payout } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function markPayoutAsPaid(input: { organizerId: string; amount: number }): Promise<{ success: boolean; message?: string }> {
    const { organizerId, amount } = input;
    const batch = firestore.batch();
    
    try {
        const userRef = firestore.collection('users').doc(organizerId);
        const payoutRef = firestore.collection('payouts').doc();

        const newPayout: Payout = {
            organizerId: organizerId,
            amount: amount,
            payoutDate: FieldValue.serverTimestamp(),
            status: 'completed',
            // In a real app, you might include the admin's ID who initiated this.
            processedBy: 'admin', 
        };

        batch.set(payoutRef, newPayout);
        
        batch.update(userRef, {
            'orgInfo.payouts.balance': FieldValue.increment(-amount),
            'orgInfo.payouts.lastPayoutDate': FieldValue.serverTimestamp(),
            'orgInfo.payouts.status': 'paid'
        });

        await batch.commit();

        return { success: true, message: 'Payout successfully recorded.' };
    } catch (error: any) {
        console.error('Error marking payout as paid:', error);
        return {
            success: false,
            message: error.message || 'Failed to record the payout.',
        };
    }
}
