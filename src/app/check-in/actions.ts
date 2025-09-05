
'use server';

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import type { Ticket, Event, UserProfile } from "@/types";

export async function validateAndCheckInTicket(ticketId: string): Promise<{
    success: boolean;
    message: string;
    ticketData?: {
        status: 'valid' | 'used' | 'invalid';
        id: string;
        eventName: string;
        attendee: string;
    }
}> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: "You must be logged in to check in tickets." };
    }

    try {
        const ticketRef = doc(firestore, "tickets", ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
             return { success: false, message: "Ticket not found.", ticketData: { status: 'invalid', id: ticketId, eventName: 'N/A', attendee: 'N/A' } };
        }

        const ticket = ticketSnap.data() as Ticket;

        // Verify that the logged-in user is the organizer of the event
        const eventRef = doc(firestore, "events", ticket.eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
             return { success: false, message: "Event associated with this ticket not found." };
        }

        const event = eventSnap.data() as Event;
        if (event.organizerId !== user.uid) {
             return { success: false, message: "You are not authorized to check in tickets for this event." };
        }
        
        // Fetch user name for attendee info
        const attendeeRef = doc(firestore, "users", ticket.userId);
        const attendeeSnap = await getDoc(attendeeRef);
        const attendeeName = attendeeSnap.exists() ? (attendeeSnap.data() as UserProfile).basicInfo.name : "Unknown Attendee";

        const baseTicketData = {
            id: ticketId,
            eventName: ticket.eventDetails?.title ?? "Event",
            attendee: attendeeName,
        };

        if (ticket.status === 'used') {
            return { success: true, message: "Ticket has already been used.", ticketData: { ...baseTicketData, status: 'used' }};
        } else {
            // Mark the ticket as used
            await updateDoc(ticketRef, { status: 'used' });
            return { success: true, message: "Ticket successfully checked in.", ticketData: { ...baseTicketData, status: 'valid' }};
        }

    } catch (error: any) {
        console.error("Error validating and checking in ticket:", error);
        return { success: false, message: error.message || "An unexpected error occurred during check-in." };
    }
}
