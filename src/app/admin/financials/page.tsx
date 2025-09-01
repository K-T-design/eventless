
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button";

const chartData = [
  { month: "January", revenue: 18600 },
  { month: "February", revenue: 30500 },
  { month: "March", revenue: 23700 },
  { month: "April", revenue: 7300 },
  { month: "May", revenue: 20900 },
  { month: "June", revenue: 21400 },
];

const chartConfig = {
  revenue: {
    label: "Revenue (₦)",
    color: "hsl(var(--primary))",
  },
};


export default function FinancialsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Financials</h1>
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>A chart showing revenue from fees & subscriptions over time. (Placeholder data)</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
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
}
