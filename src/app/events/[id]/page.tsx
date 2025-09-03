
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, MapPin, Ticket, University } from "lucide-react";
import Image from "next/image";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs as getSubDocs, query } from "firebase/firestore";
import type { Event, TicketTier } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const getLowestPrice = (tiers: TicketTier[] | undefined) => {
    if (!tiers || tiers.length === 0) return 0;
    return tiers.reduce((min, tier) => tier.price < min ? tier.price : min, tiers[0].price);
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      const fetchEvent = async () => {
        setLoading(true);
        const eventDocRef = doc(firestore, "events", params.id);
        const eventDocSnap = await getDoc(eventDocRef);

        if (eventDocSnap.exists()) {
          const data = eventDocSnap.data();
          setEvent({
            id: eventDocSnap.id,
            ...data,
            date: data.date.toDate(),
          } as Event);
          
          // Fetch ticket tiers from subcollection
          const tiersQuery = query(collection(eventDocRef, "ticketTiers"));
          const tiersSnapshot = await getSubDocs(tiersQuery);
          const tiersList = tiersSnapshot.docs.map(doc => doc.data() as TicketTier);
          setTicketTiers(tiersList);

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
  const lowestPrice = getLowestPrice(ticketTiers);

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
             <Badge className="absolute top-4 left-4" variant="secondary">{event.category}</Badge>
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
             <div className="mt-8 bg-muted/50 p-6 rounded-lg">
                <p className="text-sm text-muted-foreground">Tickets starting from</p>
                <p className="text-3xl font-bold text-primary">
                    {lowestPrice > 0 ? `₦${lowestPrice.toLocaleString()}` : 'Free'}
                </p>
                 {!user && !authLoading && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        You must be <a href="/auth/signin" className="underline font-semibold">signed in</a> to get a ticket.
                    </p>
                )}
            </div>
        </div>
        
        <div className="md:col-span-2">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-3xl font-bold font-headline mb-4 border-b pb-2">About this Event</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {event.description}
                    </p>
                </div>
                 <div>
                    <h2 className="text-3xl font-bold font-headline mb-4 border-b pb-2">Tickets</h2>
                     <div className="space-y-4">
                        {ticketTiers.map(tier => (
                            <div key={tier.name} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{tier.name}</h3>
                                    <p className="font-bold text-primary">
                                        {tier.price > 0 ? `₦${tier.price.toLocaleString()}` : 'Free'}
                                    </p>
                                    {tier.description && <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>}
                                </div>
                                 <Button 
                                    asChild
                                    disabled={authLoading || !user || isEventInThePast}
                                    className="shrink-0"
                                >
                                    <Link href={`/checkout/${event.id}?tier=${encodeURIComponent(tier.name)}`}>
                                        <Ticket className="mr-2 h-4 w-4" />
                                        {isEventInThePast ? "Event Passed" : "Get Ticket"}
                                    </Link>
                                </Button>
                            </div>
                        ))}
                         {ticketTiers.length === 0 && !loading && (
                            <p className="text-muted-foreground text-sm">Tickets are not available for this event yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
