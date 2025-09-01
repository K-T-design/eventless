
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc,getCountFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Users, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalEvents: 0,
      pendingEvents: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
        // Fetch stats
        const usersCollection = collection(firestore, "users");
        const eventsCollection = collection(firestore, "events");
        
        const usersSnapshot = await getCountFromServer(usersCollection);
        const eventsSnapshot = await getCountFromServer(eventsCollection);
        
        const pendingQuery = query(eventsCollection, where("status", "==", "pending"));
        const pendingSnapshot = await getCountFromServer(pendingQuery);

        setStats({
            totalUsers: usersSnapshot.data().count,
            totalEvents: eventsSnapshot.data().count,
            pendingEvents: pendingSnapshot.data().count,
        });

      // Fetch pending events for the queue
      const q = query(eventsCollection, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              date: data.date.toDate(),
          } as Event;
      });
      setPendingEvents(eventsList);
    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch dashboard data.",
      });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
      fetchDashboardData();
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
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card className={stats.pendingEvents > 0 ? "border-destructive text-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Pending Approval</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.pendingEvents > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEvents}</div>
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="text-2xl font-bold font-headline my-6">Event Approval Queue</h2>
        {pendingEvents.length > 0 ? (
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Event Title</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingEvents.map((event) => (
                    <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{event.university}</TableCell>
                        <TableCell>{format(event.date, "PPP")}</TableCell>
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
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                <p className="text-muted-foreground">There are no pending events to review. Great job!</p>
            </div>
        )}
    </div>
    </>
  );
}

