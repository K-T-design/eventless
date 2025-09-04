
"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { getOrganizerDashboardData, type OrganizerDashboardData } from "./actions";
import { Loader2, Calendar, Ticket, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function OrganizerDashboardPage() {
  const [user, authLoading] = useAuthState(auth);
  const [dashboardData, setDashboardData] = useState<OrganizerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const data = await getOrganizerDashboardData(user.uid);
          setDashboardData(data);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not fetch dashboard data.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

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

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
     return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold">Could not load data</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }
  
  const { stats, events } = dashboardData;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
            <h1 className="text-4xl font-bold font-headline">Organizer Dashboard</h1>
            <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your events.
            </p>
        </div>
         <Button asChild className="mt-4 md:mt-0">
            <Link href="/create-event">Create New Event</Link>
         </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">from all events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalTicketsSold.toLocaleString()}</div>
                 <p className="text-xs text-muted-foreground">across all events</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                 <p className="text-xs text-muted-foreground">created on the platform</p>
            </CardContent>
          </Card>
       </div>

       <Card>
        <CardHeader>
            <CardTitle>My Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {events.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Tickets Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map((event) => (
                        <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{format(event.date, 'PP')}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(event.status)} className="capitalize">{event.status}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{event.ticketsSold}</TableCell>
                            <TableCell className="text-right">₦{event.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/organizer/event/${event.id}`}>View Details</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg m-6 bg-card">
                    <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                    <p className="text-muted-foreground mb-6">You haven't created any events yet. Let's change that!</p>
                    <Button asChild>
                        <Link href="/create-event">Create Your First Event</Link>
                    </Button>
                </div>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
