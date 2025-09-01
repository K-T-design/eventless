
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, MapPin, Ticket, University } from "lucide-react";
import Image from "next/image";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import type { Event, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      const fetchEvent = async () => {
        setLoading(true);
        const docRef = doc(firestore, "events", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setEvent({
            id: docSnap.id,
            ...data,
            date: data.date.toDate(),
          } as Event);
        } else {
          console.error("No such document!");
          toast({
            variant: "destructive",
            title: "Error",
            description: "Event not found.",
          })
        }
        setLoading(false);
      };

      fetchEvent();
    }
  }, [params.id]);

  const handleBuyTicket = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not logged in",
            description: "You must be signed in to purchase a ticket.",
        });
        router.push('/auth/signin');
        return;
    }

    if (!event) return;

    setPurchaseLoading(true);

    try {
        const batch = writeBatch(firestore);

        // 1. Create the Ticket document
        const ticketRef = doc(collection(firestore, "tickets"));
        const newTicket = {
            eventId: event.id,
            userId: user.uid,
            purchaseDate: serverTimestamp(),
            status: 'valid' as const,
            // Denormalized data for easier access on the "My Tickets" page
            eventDetails: {
                title: event.title,
                date: event.date,
                location: event.location,
            }
        };
        batch.set(ticketRef, newTicket);

        // 2. Create the Transaction document
        const transactionRef = doc(collection(firestore, "transactions"));
        const newTransaction: Omit<Transaction, 'id'> = {
            userId: user.uid,
            ticketId: ticketRef.id,
            amount: event.price,
            status: 'succeeded',
            paymentGateway: event.price > 0 ? 'paystack' : 'free', // Placeholder
            transactionDate: serverTimestamp(),
        };
        batch.set(transactionRef, newTransaction);
        
        await batch.commit();

        toast({
            title: "Success!",
            description: "Your ticket has been secured. View it in 'My Tickets'.",
        });
        
        router.push('/my-tickets');

    } catch (error) {
        console.error("Error purchasing ticket: ", error);
        toast({
            variant: "destructive",
            title: "Purchase Failed",
            description: "Something went wrong. Please try again.",
        });
    } finally {
        setPurchaseLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
       <div className="container mx-auto max-w-5xl py-12 px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Skeleton className="aspect-video rounded-lg" />
            <div className="flex flex-col justify-center gap-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
             <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-24 w-full" />
            </div>
          </div>
       </div>
    )
  }

  if (!event) {
    return <div className="text-center py-12">Event not found.</div>;
  }
  
  const isEventInThePast = new Date() > event.date;

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
             <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                data-ai-hint={event.imageHint}
            />
        </div>
        
        <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">{event.title}</h1>
            <div className="flex flex-col gap-4 text-lg text-muted-foreground">
                <div className="flex items-center gap-3">
                    <University className="h-5 w-5 text-primary" />
                    <span>{event.university}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{format(event.date, 'PPP')}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.location}</span>
                </div>
            </div>
             <div className="mt-8 flex items-center justify-between bg-muted/50 p-6 rounded-lg">
                <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-3xl font-bold text-primary">
                        {event.price > 0 ? `₦${event.price.toLocaleString()}` : 'Free'}
                    </p>
                </div>
                <Button size="lg" className="flex items-center gap-2" onClick={handleBuyTicket} disabled={purchaseLoading || !user || isEventInThePast}>
                    {purchaseLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" /> 
                    ) : (
                        <Ticket className="h-5 w-5"/>
                    )}
                    {isEventInThePast ? "Event has passed" : (event.price > 0 ? "Buy Ticket" : "Get Ticket")}
                </Button>
            </div>
            {!user && !authLoading && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                    You must be <a href="/auth/signin" className="underline font-semibold">signed in</a> to get a ticket.
                </p>
            )}
        </div>
        
        <div className="md:col-span-2">
            <h2 className="text-3xl font-bold font-headline mb-4 border-b pb-2">About this Event</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {event.description}
            </p>
        </div>
      </div>
    </div>
  )
}
