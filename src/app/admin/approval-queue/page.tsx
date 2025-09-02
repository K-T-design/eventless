
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApprovalQueuePage() {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const eventsCollection = collection(firestore, "events");
      const q = query(eventsCollection, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => {
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

  const handleEventStatusChange = async (eventId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const eventRef = doc(firestore, "events", eventId);
      await updateDoc(eventRef, { status: newStatus });
      toast({
        title: "Success",
        description: `Event has been ${newStatus}.`,
      });
      // Refresh the list after update
      fetchPendingEvents();
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
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Event Approval Queue</h1>
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
                                <Button size="sm" onClick={() => handleEventStatusChange(event.id, 'approved')}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleEventStatusChange(event.id, 'rejected')}>Reject</Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">There are no pending events to review. Great job!</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
