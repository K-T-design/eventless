
"use client";

import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SupportTicket } from "@/types";
import { getSupportTickets, updateTicketStatus } from "./actions";

export default function SupportInboxPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    const result = await getSupportTickets();
    if (result.success && result.data) {
      setTickets(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message || "Could not fetch support tickets.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: 'closed') => {
    const result = await updateTicketStatus(ticketId, newStatus);
    if (result.success) {
      toast({
        title: "Ticket Updated",
        description: "The ticket status has been changed to 'closed'.",
      });
      fetchTickets(); // Refresh list
      setSelectedTicket(null); // Close dialog
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };

  const getStatusVariant = (status: SupportTicket['status']) => {
    switch (status) {
      case "open": return "destructive";
      case "in_progress": return "secondary";
      case "closed": return "default";
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Support Inbox</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage User Support</CardTitle>
          <CardDescription>Review, manage, and respond to user-submitted tickets and reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>{ticket.userName}</TableCell>
                    <TableCell>{format(ticket.submittedAt, "PPp")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)} className="capitalize">
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Inbox Zero!</h3>
              <p className="text-muted-foreground">There are no open support tickets.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{selectedTicket.subject}</DialogTitle>
              <DialogDescription>
                Submitted by {selectedTicket.userName} ({selectedTicket.userEmail}) on {format(selectedTicket.submittedAt, 'PPp')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <div className="text-sm">
                <span className="font-semibold text-muted-foreground">Category: </span>
                <Badge variant="secondary" className="capitalize">{selectedTicket.category.replace('_', ' ')}</Badge>
              </div>
              <div className="p-4 bg-muted/50 rounded-md border text-sm text-foreground whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>Cancel</Button>
              <Button onClick={() => handleStatusChange(selectedTicket.id, 'closed')} disabled={selectedTicket.status === 'closed'}>
                Mark as Resolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
