
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { UserProfile, Payout } from '@/types';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("Organizer not found.");
        const userData = userSnap.data() as UserProfile;

        const newPayout: Omit<Payout, 'id'> = {
            organizerId: organizerId,
            organizerName: userData.basicInfo.name,
            amount: amount,
            payoutDate: FieldValue.serverTimestamp() as Timestamp,
            status: 'completed',
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

export async function getPayoutHistory(): Promise<{
  success: boolean;
  data?: Payout[];
  message?: string;
}> {
  try {
    const historySnapshot = await firestore.collection('payouts').orderBy('payoutDate', 'desc').limit(50).get();

    if (historySnapshot.empty) {
      return { success: true, data: [] };
    }

    const history = historySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            payoutDate: (data.payoutDate as Timestamp).toDate(),
        } as Payout;
    })

    return { success: true, data: history };
  } catch (error: any) {
     console.error('Error fetching payout history: ', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch payout history.',
    };
  }
}

    