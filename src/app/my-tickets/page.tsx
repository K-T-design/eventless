
"use client";

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { Ticket } from '@/types';
import { Loader2, QrCode, Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTicketsPage() {
  const [user, authLoading] = useAuthState(auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) {
        setLoading(false);
        return;
      };
      
      setLoading(true);
      try {
        const ticketsRef = collection(firestore, 'tickets');
        const q = query(ticketsRef, where('userId', '==', user.uid), orderBy('purchaseDate', 'desc'));
        const querySnapshot = await getDocs(q);
        const ticketsList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure date is converted from Firestore Timestamp
            if (data.eventDetails && data.eventDetails.date) {
                data.eventDetails.date = data.eventDetails.date.toDate();
            }
             if (data.purchaseDate) {
                data.purchaseDate = data.purchaseDate.toDate();
            }
            return { id: doc.id, ...data } as Ticket
        });
        setTickets(ticketsList);
      } catch (error) {
        console.error("Error fetching tickets: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
        fetchTickets();
    }
  }, [user, authLoading]);
  
  if (authLoading || loading) {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <h1 className="text-4xl font-bold font-headline mb-8">My Tickets</h1>
             <div className="grid gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-56 w-full" />
                ))}
             </div>
        </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg py-12 px-4 text-center">
        <Card>
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>You must be logged in to view your tickets.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/auth/signin">Sign In</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">My Tickets</h1>
        <p className="text-muted-foreground mt-2">
          Here are all the tickets you've acquired. Use the QR code for event check-in.
        </p>
      </div>
      
      {tickets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{ticket.eventDetails?.title ?? 'Event Title'}</CardTitle>
                 <CardDescription>
                    {ticket.tier.name} Ticket
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{ticket.eventDetails?.date ? format(ticket.eventDetails.date, 'PPP') : 'Date'}</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{ticket.eventDetails?.location ?? 'Location'}</span>
                </div>
                 <p className="text-sm text-muted-foreground pt-2">
                    Ticket ID: {ticket.id}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-end bg-muted/50 p-4 mt-4">
                <div>
                     <p className="text-xs text-muted-foreground">Status</p>
                     <p className={`font-bold text-sm ${ticket.status === 'valid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </p>
                </div>
                 <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto text-foreground" />
                    <p className="text-xs mt-1 text-muted-foreground">Show for check-in</p>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Tickets Yet</h3>
            <p className="text-muted-foreground mb-6">You haven't acquired any tickets. Find an event to attend!</p>
            <Button asChild>
                <Link href="/discover">Discover Events</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
