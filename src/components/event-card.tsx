import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types";
import { Calendar, MapPin, Ticket } from "lucide-react";

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
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
          <Calendar className="h-4 w-4" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          <span>{event.university}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <p className="text-lg font-bold text-primary">
          ₦{event.price.toLocaleString()}
        </p>
        <Button>Buy Ticket</Button>
      </CardFooter>
    </Card>
  );
}
