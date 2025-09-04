
"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getMonthlyRevenue } from "./actions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { OrganizerPayout } from "./payouts.actions";
import { getPendingPayouts, markPayoutAsPaid } from "./payouts.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ChartData = { month: string; revenue: number };

const chartConfig = {
  revenue: {
    label: "Revenue (₦)",
    color: "hsl(var(--primary))",
  },
};

export default function FinancialsPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [payouts, setPayouts] = useState<OrganizerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPayingOut, setIsPayingOut] = useState<string | null>(null); // Track which payout is processing

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    const result = await getMonthlyRevenue();
    if (result.success && result.data) {
      setChartData(result.data);
    } else {
      setError(result.message || "An unknown error occurred.");
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message || "Could not load financial data."
      });
    }
    setLoading(false);
  };

  const fetchPayouts = async () => {
    setPayoutsLoading(true);
    const result = await getPendingPayouts();
    if (result.success && result.data) {
      setPayouts(result.data);
    } else {
        toast({
        variant: "destructive",
        title: "Error fetching payouts",
        description: result.message || "Could not load payout data."
      });
    }
    setPayoutsLoading(false);
  }

  useEffect(() => {
    fetchChartData();
    fetchPayouts();
  }, []);

  const handleMarkAsPaid = async (payout: OrganizerPayout) => {
    setIsPayingOut(payout.organizerId);
    const result = await markPayoutAsPaid({
      organizerId: payout.organizerId,
      amount: payout.payoutDue,
    });
    
    if (result.success) {
      toast({
        title: "Payout Recorded",
        description: `${payout.organizerName} has been marked as paid.`,
      });
      // Refresh data
      fetchPayouts();
    } else {
       toast({
        variant: "destructive",
        title: "Payout Failed",
        description: result.message,
      });
    }
    setIsPayingOut(null);
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Financials</h1>
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>A chart showing revenue from ₦150 service fees over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="flex items-center justify-center min-h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                 ) : error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Error Loading Chart</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 ) : (
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                            />
                            <YAxis
                                tickFormatter={(value) => `₦${Number(value) / 1000}k`}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                 )}
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
                <CardDescription>A list of organizers with a balance owed. Click "Mark as Paid" after sending funds.</CardDescription>
            </CardHeader>
            <CardContent>
                {payoutsLoading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : payouts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organizer</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead className="text-right">Payout Due</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.organizerId}>
                          <TableCell className="font-medium">{payout.organizerName}</TableCell>
                          <TableCell className="text-xs">
                             {payout.bankDetails?.accountNumber ? (
                                <>
                                    <div>{payout.bankDetails.accountName}</div>
                                    <div>{payout.bankDetails.bankName} - {payout.bankDetails.accountNumber}</div>
                                </>
                             ) : (
                                <span className="text-muted-foreground">No bank details</span>
                             )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">₦{payout.payoutDue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={isPayingOut === payout.organizerId || !payout.bankDetails?.accountNumber}
                                >
                                  {isPayingOut === payout.organizerId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Mark as Paid
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Payout</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Have you transferred <strong>₦{payout.payoutDue.toLocaleString()}</strong> to <strong>{payout.organizerName}</strong>? This action will record the payout and reset their balance. It cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleMarkAsPaid(payout)}>
                                    Yes, I have paid
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                   <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                      <p className="text-muted-foreground">No pending payouts found.</p>
                  </div>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
