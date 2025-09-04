
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users, Calendar as CalendarIcon, AlertTriangle, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getDashboardData, type NewUsersData } from "./actions";


const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--primary))",
  },
};


export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalEvents: 0,
      pendingEvents: 0,
      totalRevenue: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [newUsersData, setNewUsersData] = useState<NewUsersData[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
       const result = await getDashboardData();
       if (result.success && result.data) {
            setStats(result.data.stats);
            setRecentEvents(result.data.recentEvents);
            setNewUsersData(result.data.newUsersData);
       } else {
           throw new Error(result.message || "Failed to fetch dashboard data");
       }

    } catch (error: any) {
      console.error("Error fetching dashboard data: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not fetch dashboard data.",
      });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card className={stats.pendingEvents > 0 ? "border-destructive text-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Pending Approval</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.pendingEvents > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEvents}</div>
             {stats.pendingEvents > 0 && (
              <Button asChild size="sm" className="mt-2">
                <Link href="/admin/approval-queue">Review Events</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-8 mt-8 md:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle>New Users This Month</CardTitle>
                <CardDescription>A chart showing daily new user signups for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={newUsersData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => format(new Date(value), "MMM d")}
                        />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                        dataKey="users"
                        type="natural"
                        fill="var(--color-users)"
                        fillOpacity={0.4}
                        stroke="var(--color-users)"
                        stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
          </Card>

         <Card>
           <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>The last 5 events submitted to the platform.</CardDescription>
            </CardHeader>
           <CardContent className="p-0">
             {recentEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(event.createdAt, 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(event.status)} className="capitalize">
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/events/${event.id}`} target="_blank">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             ): (
               <div className="text-center py-12 text-muted-foreground">
                 No recent events to display.
               </div>
             )}
           </CardContent>
         </Card>
      </div>
    </>
  );
}
