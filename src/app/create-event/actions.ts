
'use server';

import { collection, writeBatch, doc, getDoc, increment, serverTimestamp } from "firebase/firestore";
import { firestore } from '@/lib/firebase';
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import type { Event, TicketTier } from "@/types";
import { revalidatePath } from "next/cache";


type CreateEventInput = {
  title: string;
  description: string;
  university: string;
  category: string;
  location: string;
  date: Date;
  time: string;
  ticketTiers: TicketTier[];
}

export async function createEvent(values: CreateEventInput): Promise<{ success: boolean, message?: string, eventId?: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: "You must be logged in to create an event." };
    }
    
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
         return { success: false, message: "User profile not found." };
    }
    
    const isAdmin = userProfile.basicInfo.userType === 'super_admin' || userProfile.basicInfo.userType === 'admin';
    const hasActiveSubscription = userProfile.subscription.status === 'active';

    if (!isAdmin && !hasActiveSubscription) {
        const isOrg = userProfile.basicInfo.userType === 'organizer';
        const limit = isOrg ? 8 : 5;
        const eventsUsed = userProfile.subscription.freeEventsUsed;

        if (eventsUsed >= limit) {
             return { 
                success: false, 
                message: `You have used all your free events for this month. Please upgrade your plan.` 
            };
        }
    }

    try {
        const batch = writeBatch(firestore);

        const newEventRef = doc(collection(firestore, "events"));
        const newEventData = {
            title: values.title,
            description: values.description,
            university: values.university,
            category: values.category,
            location: values.location,
            date: values.date,
            time: values.time,
            organizerId: user.uid,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
            imageUrl: "https://picsum.photos/1200/600",
            imageHint: "event poster placeholder",
        };
        batch.set(newEventRef, newEventData);

        values.ticketTiers.forEach(tier => {
            const tierRef = doc(collection(firestore, `events/${newEventRef.id}/ticketTiers`));
            batch.set(tierRef, tier);
        });

        // Only increment free event counter if user is not admin and does NOT have an active subscription
        if (!isAdmin && !hasActiveSubscription) {
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { 'subscription.freeEventsUsed': increment(1) });
        }
        
        await batch.commit();
        
        revalidatePath('/discover');

        return { success: true, message: "Event submitted for approval!", eventId: newEventRef.id };
    } catch (error: any) {
         return { success: false, message: error.message || "Failed to create event." };
    }
}
