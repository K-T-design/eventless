
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types";
import { Calendar, MapPin, University } from "lucide-react";
import { format } from 'date-fns';
import { useEffect, useState } from "react";

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    // Format the date on the client-side to avoid hydration mismatch
    setFormattedDate(format(event.date, 'PPP'));
  }, [event.date]);

  return (
    <Link href={`/events/${event.id}`} className="flex flex-col h-full group">
      <Card className="overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <div className="relative w-full h-48">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            data-ai-hint={event.imageHint}
          />
        </div>
        <CardHeader>
          <CardTitle className="font-headline h-14">{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <University className="h-4 w-4" />
            <span>{event.university}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate || "Loading date..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-4 mt-auto">
          <p className="text-lg font-bold text-primary">
            {event.price > 0 ? `₦${event.price.toLocaleString()}` : "Free"}
          </p>
          <Button>View Details</Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
