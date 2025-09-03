"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getMonthlyRevenue } from "./actions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ChartData = { month: string; revenue: number };

const chartConfig = {
  revenue: {
    label: "Revenue (₦)",
    color: "hsl(var(--primary))",
  },
};

export default function FinancialsPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

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
                <CardDescription>A list of organizers with a balance owed. Payouts are handled manually for now.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                    <p className="text-muted-foreground">Payouts management will be shown here.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
