
"use client";

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { Ticket } from '@/types';
import { Dot, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function MyTicketsPage() {
  const [user, authLoading] = useAuthState(auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ticketsRef = collection(firestore, 'tickets');
    const q = query(
      ticketsRef, 
      where('userId', '==', user.uid), 
      orderBy('purchaseDate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ticketsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            purchaseDate: (data.purchaseDate as Timestamp)?.toDate(),
            eventDetails: data.eventDetails ? {
              ...data.eventDetails,
              date: (data.eventDetails.date as Timestamp)?.toDate(),
            } : undefined,
          } as Ticket;
        });
        setTickets(ticketsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tickets: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch your tickets. Please try again later.",
        });
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, authLoading, toast]);

  const handleDownload = (ticketId: string, eventTitle: string) => {
    const canvas = document.getElementById(`qr-code-${ticketId}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${eventTitle}-ticket.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
       toast({
        title: "Download Started",
        description: "Your ticket QR code is being downloaded.",
      });
    } else {
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not find the QR code to download.",
        });
    }
  };
  
  if (authLoading || loading) {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <h1 className="text-4xl font-bold font-headline mb-8">My Tickets</h1>
             <div className="grid gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
             </div>
        </div>
    )
  }

  if (!user && !authLoading) {
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
          Here are all the tickets you've acquired. Click one to view the QR code for event check-in.
        </p>
      </div>
      
      {tickets.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {tickets.map(ticket => (
            <AccordionItem key={ticket.id} value={ticket.id} className="border-b-0">
                 <AccordionTrigger className="p-4 bg-card rounded-lg shadow-sm hover:no-underline hover:shadow-md transition-shadow data-[state=open]:rounded-b-none">
                     <div className="flex w-full items-start justify-between text-left">
                        <div>
                            <h3 className="font-bold text-lg">{ticket.eventDetails?.title ?? 'Event Title'}</h3>
                            <p className="text-sm text-muted-foreground">{ticket.tier.name} Ticket</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                {ticket.eventDetails?.date && <span>{format(ticket.eventDetails.date, 'PP')}</span>}
                                <Dot />
                                <span>{ticket.eventDetails?.location ?? 'Location'}</span>
                            </div>
                        </div>
                        <Badge variant={ticket.status === 'valid' ? 'default' : 'secondary'} className="capitalize shrink-0">
                           {ticket.status}
                        </Badge>
                     </div>
                 </AccordionTrigger>
                 <AccordionContent className="bg-card rounded-b-lg p-6 border-t">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 p-4 bg-white rounded-lg shadow-inner">
                           <QRCodeCanvas id={`qr-code-${ticket.id}`} value={ticket.qrCodeData} size={200} />
                        </div>
                        <div className="w-full space-y-3 text-sm">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Ticket ID:</span>
                                <span className="font-mono">{ticket.id}</span>
                            </div>
                            {ticket.purchaseDate && (
                               <div className="flex justify-between">
                                    <span className="text-muted-foreground">Purchased on:</span>
                                    <span>{format(ticket.purchaseDate, 'PPP')}</span>
                                </div>
                            )}
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid:</span>
                                <span className="font-bold">₦{(ticket.tier.price).toLocaleString()}</span>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6">
                            <Button size="lg" onClick={() => setSelectedTicket(ticket)}>
                                Show Fullscreen
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => handleDownload(ticket.id, ticket.eventDetails?.title ?? 'event-ticket')}>
                                <Download className="mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                 </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No Tickets Yet</h3>
            <p className="text-muted-foreground mb-6">You haven't acquired any tickets. Find an event to attend!</p>
            <Button asChild>
                <Link href="/discover">Discover Events</Link>
            </Button>
        </div>
      )}

      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}>
            <DialogContent className="max-w-xs sm:max-w-sm rounded-lg">
                <DialogHeader className="text-center">
                    <DialogTitle className="font-headline text-2xl">{selectedTicket.eventDetails?.title}</DialogTitle>
                    <DialogDescription>
                        Present this QR code at the event entrance for scanning.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-white rounded-lg my-4 flex justify-center">
                    <QRCodeCanvas value={selectedTicket.qrCodeData} size={256} />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                    <p>{selectedTicket.tier.name} Ticket</p>
                    <p>Status: <span className="font-bold capitalize">{selectedTicket.status}</span></p>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
