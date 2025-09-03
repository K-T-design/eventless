
'use server';

import { firestore } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Ticket, Transaction, TicketTier, Event } from '@/types';
import { headers } from 'next/headers';

type VerifyPaymentInput = {
  reference: string;
  eventId: string;
  userId: string;
  tier: TicketTier;
  quantity: number;
};

const SERVICE_FEE = 150;

export async function verifyPaymentAndCreateTicket(
  input: VerifyPaymentInput
): Promise<{ success: boolean; message: string; ticketId?: string }> {
  const { reference, eventId, userId, tier, quantity } = input;
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  const isFreeTicket = tier.price === 0;

  try {
    let transactionAmount = 0;
    
    // Step 1: Verify payment with Paystack if it's not a free ticket
    if (!isFreeTicket) {
      if (!paystackSecretKey) {
        throw new Error('Paystack secret key is not configured.');
      }
      
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });

      const data = await response.json();

      if (!data.status || data.data.status !== 'success') {
        return { success: false, message: data.message || 'Payment verification failed.' };
      }
       // Amount from Paystack is in kobo
      transactionAmount = data.data.amount / 100;

      const expectedAmount = (tier.price * quantity) + SERVICE_FEE;
      if (transactionAmount < expectedAmount) {
         return { success: false, message: 'Amount paid is less than the expected amount.' };
      }

    } else {
      // For free tickets, the amount is 0
      transactionAmount = 0;
    }


    // Step 2: Check if transaction already processed
    const transactionSnapshot = await firestore.collection('transactions').where('reference', '==', reference).limit(1).get();
    if (!transactionSnapshot.empty) {
        // This is tricky with multiple tickets. For now, we assume one transaction = one purchase, even if for multiple tickets.
        // And we don't return a single ticketId anymore.
        return { success: true, message: "This transaction has already been processed."};
    }


    // Step 3: Fetch Event details (denormalized for the ticket)
    const eventRef = firestore.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
        throw new Error("Event not found.");
    }
    const eventData = eventSnap.data() as Event;

    
    // Step 4: Create Tickets and one Transaction doc in a batch
    const batch = firestore.batch();
    const ticketIds: string[] = [];

    for (let i = 0; i < quantity; i++) {
        const ticketRef = firestore.collection('tickets').doc();
        const qrCodeData = `eventless-ticket:${ticketRef.id}`;
        
        const newTicket: Omit<Ticket, 'id'> = {
            eventId: eventId,
            userId: userId,
            purchaseDate: FieldValue.serverTimestamp() as Timestamp,
            status: 'valid',
            qrCodeData: qrCodeData,
            tier: tier,
            eventDetails: {
              title: eventData.title,
              date: eventData.date, // This is already a Firestore Timestamp from the source
              location: eventData.location,
            },
        };
        batch.set(ticketRef, newTicket);
        ticketIds.push(ticketRef.id);
    }


    const transactionRef = firestore.collection('transactions').doc();
    const newTransaction: Omit<Transaction, 'id'> = {
        userId: userId,
        ticketId: ticketIds.join(','), // Store multiple ticket IDs
        amount: transactionAmount,
        status: 'succeeded',
        paymentGateway: isFreeTicket ? 'free' : 'paystack',
        transactionDate: FieldValue.serverTimestamp() as Timestamp,
        reference: reference,
    };
    batch.set(transactionRef, newTransaction);
    
    await batch.commit();

    return { success: true, message: `Successfully created ${quantity} ticket(s)!` };

  } catch (error: any) {
    console.error('Error in verifyPaymentAndCreateTicket:', error);
    return { success: false, message: error.message || 'An internal server error occurred.' };
  }
}
