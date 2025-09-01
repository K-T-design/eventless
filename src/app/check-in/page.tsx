
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Ticket, UserCheck, XCircle } from "lucide-react";

type TicketStatus = "valid" | "used" | "invalid";

const mockTicketData = {
  id: "EVT-UNILAG-2024-T938A1",
  eventName: "Tech Innovators Conference 2024",
  attendee: "John Doe",
};

export default function CheckInPage() {
  const [scanned, setScanned] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("valid");

  const handleScan = () => {
    setScanned(true);
    // In a real app, you'd get this status from a database lookup
    // For now, we'll cycle through statuses to test the UI
    const statuses: TicketStatus[] = ["valid", "used", "invalid"];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    setTicketStatus(statuses[randomIndex]);
  };

  const handleConfirm = () => {
    // In a real app, this would update the ticket status in the database
    setTicketStatus("used");
  };

  const handleReset = () => {
    setScanned(false);
  };
  
  const getStatusInfo = () => {
    switch (ticketStatus) {
      case "valid":
        return {
          text: "Ticket Valid",
          color: "text-green-600",
          icon: <UserCheck className="h-8 w-8" />,
        };
      case "used":
        return {
          text: "Already Used",
          color: "text-yellow-600",
          icon: <Ticket className="h-8 w-8" />,
        };
      case "invalid":
        return {
          text: "Ticket Invalid",
          color: "text-red-600",
          icon: <XCircle className="h-8 w-8" />,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="container mx-auto max-w-md py-12 px-4 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold font-headline mb-2">Event Check-in</h1>
      <p className="text-muted-foreground mb-8">
        Scan attendee tickets to validate and process entry.
      </p>

      {!scanned ? (
        <Card className="w-full shadow-lg">
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <QrCode className="h-24 w-24 text-muted-foreground mb-6" />
            <Button size="lg" className="w-full" onClick={handleScan}>
              Scan Ticket QR Code
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Use your device's camera to scan the QR code on the ticket.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full shadow-xl animate-in fade-in-50 zoom-in-95">
          <CardHeader className="items-center">
            <div className={`p-4 rounded-full bg-background ${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
            <CardTitle className={`font-headline text-2xl ${statusInfo.color}`}>
              {statusInfo.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-muted-foreground">Ticket ID</p>
              <p className="font-mono">{mockTicketData.id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Event</p>
              <p>{mockTicketData.eventName}</p>
            </div>
             <div>
              <p className="text-sm font-semibold text-muted-foreground">Attendee</p>
              <p>{mockTicketData.attendee}</p>
            </div>
            {ticketStatus === "valid" && (
               <Button size="lg" className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
                Confirm Check-in
              </Button>
            )}
            <Button size="lg" variant="outline" className="w-full" onClick={handleReset}>
              Scan Next Ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
