
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Calendar, MapPin, University, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function ApprovalQueuePage() {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const eventsCollection = collection(firestore, "events");
      const q = query(eventsCollection, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Event;
      });
      setPendingEvents(eventsList);
    } catch (error) {
      console.error("Error fetching pending events: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch pending events.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const handleEventStatusChange = async (
    eventId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      const eventRef = doc(firestore, "events", eventId);
      await updateDoc(eventRef, { status: newStatus });
      toast({
        title: "Success",
        description: `Event has been ${newStatus}.`,
      });
      // Refresh the list after update
      fetchPendingEvents();
      // Close dialog if open
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error(`Error updating event ${eventId}: `, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not update the event.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">
        Event Approval Queue
      </h1>
      <Card>
        <CardContent className="p-0">
          {pendingEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.university}</TableCell>
                    <TableCell>{format(event.createdAt, "PPP")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{event.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleEventStatusChange(event.id, "approved")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleEventStatusChange(event.id, "rejected")
                        }
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                There are no pending events to review. Great job!
              </p>
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
                Review the event details below before making a decision.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() =>
                  handleEventStatusChange(selectedEvent.id, "rejected")
                }
              >
                Reject Event
              </Button>
              <Button
                onClick={() =>
                  handleEventStatusChange(selectedEvent.id, "approved")
                }
              >
                Approve Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
