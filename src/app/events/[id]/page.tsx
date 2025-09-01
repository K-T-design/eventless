
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, University } from "lucide-react";
import Image from "next/image";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Event } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

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
        }
        setLoading(false);
      };

      fetchEvent();
    }
  }, [params.id]);

  if (loading) {
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
                <Button size="lg" className="flex items-center gap-2">
                    <Ticket className="h-5 w-5"/>
                    Buy Ticket
                </Button>
            </div>
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
