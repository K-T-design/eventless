
"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { getEventDetailsForOrganizer, type EventDetailsData } from "./actions";
import { Loader2, ArrowLeft, Ticket, Wallet, Download } from "lucide-react";
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

export default function OrganizerEventDetailPage({ params }: { params: { id: string } }) {
  const [user, authLoading] = useAuthState(auth);
  const [eventDetails, setEventDetails] = useState<EventDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user && params.id) {
        setLoading(true);
        try {
          const data = await getEventDetailsForOrganizer(params.id, user.uid);
          setEventDetails(data);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not fetch event details.",
            className: "toast-error",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, params.id]);
  
  const getEventStatusVariant = (status: 'pending' | 'approved' | 'rejected') => {
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

  const getTicketStatusVariant = (status: 'valid' | 'used') => {
    switch(status) {
        case 'valid':
            return 'default';
        case 'used':
            return 'secondary'
    }
  }
  
  const handleExportCSV = () => {
    if (!eventDetails || !eventDetails.attendees) return;

    const headers = ["Name", "Email", "Ticket Tier", "Price", "Status", "Purchase Date"];
    const csvRows = [headers.join(",")];

    eventDetails.attendees.forEach(attendee => {
        const row = [
            `"${attendee.userName}"`,
            attendee.userEmail,
            attendee.ticketTier,
            attendee.price,
            attendee.status,
            format(attendee.purchaseDate, "yyyy-MM-dd HH:mm:ss")
        ];
        csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${eventDetails.event.title}-attendees.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    toast({ title: "Export Started", description: "Your attendee list is downloading." });
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!eventDetails) {
     return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold">Could not load event data</h2>
        <p className="text-muted-foreground">This could be because the event doesn't exist or you don't have permission to view it.</p>
         <Button asChild variant="outline" className="mt-4">
            <Link href="/organizer/dashboard">
                <ArrowLeft className="mr-2"/>
                Back to Dashboard
            </Link>
         </Button>
      </div>
    );
  }
  
  const { event, stats, attendees } = eventDetails;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/organizer/dashboard">
                <ArrowLeft className="mr-2"/>
                Back to Dashboard
            </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
                <h1 className="text-4xl font-bold font-headline">{event.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-muted-foreground">{format(event.date, 'PPPP')}</p>
                    <Badge variant={getEventStatusVariant(event.status)} className="capitalize">{event.status}</Badge>
                </div>
            </div>
            <Button onClick={handleExportCSV} disabled={attendees.length === 0}>
                <Download className="mr-2"/>
                Export Attendee List
            </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.ticketsSold.toLocaleString()}</div>
            </CardContent>
          </Card>
       </div>

       <Card>
        <CardHeader>
            <CardTitle>Attendee List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {attendees.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Ticket Tier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendees.map((attendee) => (
                        <TableRow key={attendee.ticketId}>
                            <TableCell className="font-medium">{attendee.userName}</TableCell>
                            <TableCell>{attendee.userEmail}</TableCell>
                            <TableCell>{attendee.ticketTier}</TableCell>
                            <TableCell>
                                <Badge variant={getTicketStatusVariant(attendee.status)} className="capitalize">{attendee.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">₦{attendee.price.toLocaleString()}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg m-6 bg-card">
                    <h3 className="text-xl font-semibold mb-2">No Tickets Sold Yet</h3>
                    <p className="text-muted-foreground">Check back here once your tickets start selling!</p>
                </div>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
