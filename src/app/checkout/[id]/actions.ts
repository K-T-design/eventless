
'use server';

import { firestore } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Ticket, Transaction, TicketTier, Event, UserProfile } from '@/types';
import { sendTicketEmail } from '@/lib/email';
import { format } from 'date-fns';

type VerifyPaymentInput = {
  reference: string;
  eventId: string;
  userId: string;
  tier: TicketTier;
  quantity: number;
};

const SERVICE_FEE = 150;

// This is a helper function to isolate the email sending logic and its error handling.
async function createAndSendTicket(
    event: Event, 
    user: UserProfile, 
    ticketData: Omit<Ticket, 'id'>, 
    quantity: number
) {
  try {
    const ticketId = ticketData.qrCodeData.split(':')[1]; // Extract ticket ID from QR data
    const emailResult = await sendTicketEmail(
        user.basicInfo.email,
        user.basicInfo.name,
        event.title,
        ticketId
    );

    if (!emailResult.success) {
      console.warn(`Email sending failed for user ${user.id}: ${emailResult.message}`);
    }

  } catch (emailError) {
      console.error(`Failed to send ticket email for user ${user.id} and ticket ${ticketData.qrCodeData}. Reason:`, emailError);
      // We don't throw an error here to the end-user because the purchase itself was successful.
      // This should be logged for monitoring by the admin (e.g., using a logging service).
      // The user will still get their ticket in "My Tickets", but we acknowledge the email failed.
  }
}

export async function verifyPaymentAndCreateTicket(
  input: VerifyPaymentInput
): Promise<{ success: boolean; message: string; ticketId?: string }> {
  const { reference, eventId, userId, tier, quantity } = input;
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  const isFreeTicket = tier.price === 0;

  try {
    let transactionAmount = 0;
    let paymentStatus = 'success';
    
    // Free tickets bypass payment verification
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
      transactionAmount = data.data.amount / 100; // Amount is in kobo
      paymentStatus = data.data.status;

      const expectedAmount = (tier.price * quantity) + SERVICE_FEE;
      if (transactionAmount < expectedAmount) {
         return { success: false, message: 'Amount paid is less than the expected amount.' };
      }
    }

    // Check if a paid transaction has already been processed to prevent replay attacks.
    const transactionSnapshot = await firestore.collection('transactions').where('reference', '==', reference).limit(1).get();
    if (!transactionSnapshot.empty && !isFreeTicket) {
        // This is not an error, just an indication that the webhook might have run first.
        return { success: true, message: "This transaction has already been processed."};
    }

    const eventRef = firestore.collection('events').doc(eventId);
    const userRef = firestore.collection('users').doc(userId);
    
    let firstTicketData: Omit<Ticket, 'id'> | null = null;
    let createdTicketIds: string[] = [];
    
    // Use a transaction to ensure all database writes succeed or fail together.
    const { eventData, userData, organizerRef } = await firestore.runTransaction(async (transaction) => {
        const eventSnap = await transaction.get(eventRef);
        if (!eventSnap.exists) {
            throw new Error("Event not found.");
        }
        const eventData = eventSnap.data() as Event;

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
            throw new Error("User not found.");
        }
        const userData = userSnap.data() as UserProfile;

        const orgRef = firestore.collection('users').doc(eventData.organizerId);
        
        const ticketRevenue = tier.price * quantity;
        
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
                  date: eventData.date as any, // Firestore will convert JS Date to Timestamp
                  location: eventData.location,
                  organizerId: eventData.organizerId,
                },
            };
            transaction.set(ticketRef, newTicket);
            createdTicketIds.push(ticketRef.id);

            // We only need one ticket's data for the confirmation email
            if (i === 0) {
              firstTicketData = newTicket;
            }
        }

        const transactionRef = firestore.collection('transactions').doc();
        const newTransaction: Omit<Transaction, 'id'> = {
            userId: userId,
            ticketId: createdTicketIds.join(','),
            amount: transactionAmount,
            status: 'succeeded',
            paymentGateway: isFreeTicket ? 'free' : 'paystack',
            transactionDate: FieldValue.serverTimestamp() as Timestamp,
            reference: isFreeTicket ? `free-${createdTicketIds[0]}` : reference,
        };
        transaction.set(transactionRef, newTransaction);
        
        if (ticketRevenue > 0) {
            transaction.update(orgRef, {
                'payouts.balance': FieldValue.increment(ticketRevenue),
                'payouts.status': 'pending'
            });
        }

        return { eventData, userData, organizerRef: orgRef };
    });

    // Send email *after* the database transaction has been successfully committed.
    if(firstTicketData) {
      await createAndSendTicket({ ...eventData, id: eventId }, { ...userData, id: userId }, firstTicketData, quantity);
    }

    return { success: true, message: `Successfully created ${quantity} ticket(s)! Your ticket is in your "My Tickets" section. A confirmation email has been sent.` };

  } catch (error: any) {
    console.error('Error in verifyPaymentAndCreateTicket:', error);
    return { success: false, message: error.message || 'An internal server error occurred.' };
  }
}
