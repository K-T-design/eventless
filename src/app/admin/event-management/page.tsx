
"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Event, UserProfile, TicketTier } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Calendar, MapPin, University, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateEventStatus } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";


type EventStatus = 'pending' | 'approved' | 'rejected';
type EventWithDetails = Event & { 
  organizer?: UserProfile['basicInfo'];
  ticketTiers?: TicketTier[];
};


export default function EventManagementPage() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsCollection = collection(firestore, "events");
      const q = query(eventsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const eventsList = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const event: Event = {
            id: docSnapshot.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate(),
          } as Event;

          let organizerInfo: UserProfile['basicInfo'] | undefined;
          if (event.organizerId) {
            const userRef = doc(firestore, 'users', event.organizerId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              organizerInfo = (userSnap.data() as UserProfile).basicInfo;
            }
          }
          
          const tiersRef = collection(docSnapshot.ref, "ticketTiers");
          const tiersSnapshot = await getDocs(tiersRef);
          const ticketTiers = tiersSnapshot.docs.map(tierDoc => tierDoc.data() as TicketTier);

          return { ...event, organizer: organizerInfo, ticketTiers };
        })
      );
      
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch event data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTakeDown = async (eventId: string) => {
    const result = await updateEventStatus(eventId, 'rejected');
    if (result.success) {
      toast({
        title: "Event Taken Down",
        description: "The event has been removed from the public listing.",
      });
      // Optimistically update the UI
      setEvents(events.map(e => e.id === eventId ? { ...e, status: 'rejected' } : e));
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };

  const universities = useMemo(() => [...new Set(events.map(event => event.university))], [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) =>
        statusFilter !== 'all' ? event.status === statusFilter : true
      )
      .filter((event) =>
        universityFilter !== 'all' ? event.university === universityFilter : true
      );
  }, [events, statusFilter, universityFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const getStatusVariant = (status: EventStatus) => {
    switch (status) {
        case 'approved':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'rejected':
            return 'destructive';
        default:
            return 'outline';
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-headline">Event Management</h1>
      </div>
      
      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row gap-4">
                <Select onValueChange={(value: "all" | EventStatus) => setStatusFilter(value)} defaultValue={statusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                 <Select onValueChange={setUniversityFilter} defaultValue={universityFilter}>
                    <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="Filter by university" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Universities</SelectItem>
                        {universities.map(uni => (
                        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.title}
                    </TableCell>
                    <TableCell>{event.university}</TableCell>
                    <TableCell>{format(event.date, "PPP")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(event.status)} className="capitalize">
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedEvent(event)}>View</Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          disabled={event.status !== 'approved'}
                          onClick={() => handleTakeDown(event.id)}
                        >
                          Take Down
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events match the current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedEvent && (
        <Dialog
          open={!!selectedEvent}
          onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">
                {selectedEvent.title}
              </DialogTitle>
              <DialogDescription>
                Viewing full event details.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
                <div className="grid gap-6 py-4">
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                    <Image
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                    data-ai-hint={selectedEvent.imageHint}
                    />
                </div>
                <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                    <University className="h-4 w-4 text-primary" />
                    <span>{selectedEvent.university}</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{format(selectedEvent.date, "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{selectedEvent.location}</span>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedEvent.description}
                    </p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground mb-2">Ticket Tiers</h3>
                    <div className="space-y-2">
                        {selectedEvent.ticketTiers?.map(tier => (
                            <div key={tier.name} className="flex justify-between items-center p-2 rounded-md bg-muted/50 text-sm">
                                <div>
                                    <p className="font-medium">{tier.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {tier.quantity.toLocaleString()}</p>

                                </div>
                                <p className="font-semibold text-primary">
                                    {tier.price > 0 ? `₦${tier.price.toLocaleString()}` : 'Free'}
                                </p>
                            </div>
                        ))}
                         {(!selectedEvent.ticketTiers || selectedEvent.ticketTiers.length === 0) && (
                            <p className="text-sm text-muted-foreground">No ticket tiers found for this event.</p>
                        )}
                    </div>
                </div>
                 {selectedEvent.organizer && (
                     <div>
                        <h3 className="font-semibold text-foreground mb-2">Organizer</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <User className="h-4 w-4 text-primary" />
                            <div>
                                <p>{selectedEvent.organizer.name}</p>
                                <p>{selectedEvent.organizer.email}</p>
                            </div>
                        </div>
                    </div>
                 )}
                </div>
            </ScrollArea>
             <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
