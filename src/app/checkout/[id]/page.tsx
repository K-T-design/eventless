
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Loader2,
  MapPin,
  Ticket as TicketIcon,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { auth, firestore } from "@/lib/firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import type { Event, Ticket, Transaction, TicketTier } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SERVICE_FEE = 150;

// Find the default tier (lowest price)
const getDefaultTier = (tiers: TicketTier[]): TicketTier | null => {
    if (!tiers || tiers.length === 0) return null;
    return tiers.reduce((min, tier) => tier.price < min.price ? tier : min, tiers[0]);
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  // For now, we'll just use the default (lowest price) tier.
  // In the future, this could be passed via URL params.
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);

  useEffect(() => {
    if (params.id) {
      const fetchEvent = async () => {
        setLoading(true);
        const docRef = doc(firestore, "events", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedEvent = {
            id: docSnap.id,
            ...data,
            date: data.date.toDate(),
          } as Event;
          setEvent(fetchedEvent);
          setSelectedTier(getDefaultTier(fetchedEvent.ticketTiers));
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Event not found.",
          });
          router.push("/discover");
        }
        setLoading(false);
      };

      fetchEvent();
    }
  }, [params.id, router, toast]);

  const handlePurchase = async () => {
    if (!user || !event || !selectedTier) return;

    setProcessing(true);
    try {
      // 1. Create Ticket Document
      const ticketRef = await addDoc(collection(firestore, "tickets"), {
        eventId: event.id,
        userId: user.uid,
        purchaseDate: serverTimestamp(),
        status: "valid",
        qrCodeData: `eventless-ticket:${event.id}:${user.uid}`, // Simple QR data
        tier: selectedTier, // Save the selected tier
        eventDetails: {
          title: event.title,
          date: event.date,
          location: event.location,
        },
      } as Omit<Ticket, 'id'>);

      // 2. Create Transaction Document
      const finalAmount = selectedTier.price > 0 ? selectedTier.price + SERVICE_FEE : 0;
      await addDoc(collection(firestore, "transactions"), {
        userId: user.uid,
        ticketId: ticketRef.id,
        amount: finalAmount,
        status: "succeeded",
        paymentGateway: selectedTier.price > 0 ? "paystack" : "free", // Placeholder
        transactionDate: serverTimestamp(),
        reference: `evt-${Date.now()}`,
      } as Omit<Transaction, 'id'>);

      toast({
        title: "Success!",
        description: "Your ticket has been secured.",
      });

      router.push("/my-tickets");

    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const ticketPrice = selectedTier?.price ?? 0;
  const totalPrice = ticketPrice > 0 ? ticketPrice + SERVICE_FEE : 0;

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-lg py-12 px-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event || !selectedTier) {
    // This case is mostly handled by the redirect in useEffect, but it's a good fallback.
    return (
      <div className="container mx-auto max-w-lg py-12 px-4 text-center">
        Event or ticket information not found.
      </div>
    );
  }

   if (new Date() > event.date) {
    return (
         <div className="container mx-auto max-w-lg py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">Event Has Passed</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">
                        This event has already taken place and tickets are no longer available.
                    </p>
                    <Button onClick={() => router.push('/discover')}>
                        Discover Other Events
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <p className="text-primary font-semibold text-sm mb-2">
            You're almost there!
          </p>
          <CardTitle className="font-headline text-3xl">
            Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50 border flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-md overflow-hidden shrink-0">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-lg">{event.title}</h3>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(event.date, "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Ticket ({selectedTier.name}):</p>
                <p>₦{ticketPrice.toLocaleString()}</p>
              </div>
               <div className="flex justify-between">
                <p className="text-muted-foreground">Service Fee:</p>
                <p>₦{SERVICE_FEE.toLocaleString()}</p>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <p>Total:</p>
                <p>₦{totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Gateway Notice</AlertTitle>
            <AlertDescription>
                This is a placeholder checkout. No real payment will be processed. Clicking "Confirm" will generate a real ticket.
            </AlertDescription>
           </Alert>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            className="w-full"
            onClick={handlePurchase}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <TicketIcon className="mr-2" />
                Confirm Purchase
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
