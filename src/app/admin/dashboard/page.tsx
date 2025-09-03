
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users, Calendar as CalendarIcon, AlertTriangle, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const SERVICE_FEE = 150;

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalEvents: 0,
      pendingEvents: 0,
      totalRevenue: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
        const usersCollection = collection(firestore, "users");
        const eventsCollection = collection(firestore, "events");
        const ticketsCollection = collection(firestore, "tickets");
        
        const usersSnapshot = await getCountFromServer(usersCollection);
        const eventsSnapshot = await getCountFromServer(eventsCollection);
        
        const pendingQuery = query(eventsCollection, where("status", "==", "pending"));
        const pendingSnapshot = await getCountFromServer(pendingQuery);
        
        const paidTicketsQuery = query(ticketsCollection, where("tier.price", ">", 0));
        const paidTicketsSnapshot = await getCountFromServer(paidTicketsQuery);
        const totalRevenue = paidTicketsSnapshot.data().count * SERVICE_FEE;

        const recentEventsQuery = query(eventsCollection, orderBy("createdAt", "desc"), limit(5));
        const recentEventsSnapshot = await getDocs(recentEventsQuery);
        const fetchedRecentEvents = recentEventsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate(),
          } as Event;
        });
        setRecentEvents(fetchedRecentEvents);

        setStats({
            totalUsers: usersSnapshot.data().count,
            totalEvents: eventsSnapshot.data().count,
            pendingEvents: pendingSnapshot.data().count,
            totalRevenue: totalRevenue,
        });

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

  const getStatusVariant = (status: 'pending' | 'approved' | 'rejected') => {
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

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
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
             {stats.pendingEvents > 0 && (
              <Button asChild size="sm" className="mt-2">
                <Link href="/admin/approval-queue">Review Events</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline my-6">Recent Activity</h2>
         <Card>
           <CardContent className="p-0">
             {recentEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.university}</TableCell>
                      <TableCell>{format(event.createdAt, 'PPp')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(event.status)} className="capitalize">
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/events/${event.id}`} target="_blank">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             ): (
               <div className="text-center py-12 text-muted-foreground">
                 No recent events to display.
               </div>
             )}
           </CardContent>
         </Card>
      </div>
    </>
  );
}
