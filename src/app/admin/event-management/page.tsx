
"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EventStatus = 'pending' | 'approved' | 'rejected';

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsCollection = collection(firestore, "events");
      const q = query(eventsCollection, orderBy("createdAt", "desc"));
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
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="destructive">Take Down</Button>
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
    </>
  );
}
