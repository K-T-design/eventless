
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";


export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalEvents: 0,
      pendingEvents: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
        const usersCollection = collection(firestore, "users");
        const eventsCollection = collection(firestore, "events");
        
        const usersSnapshot = await getCountFromServer(usersCollection);
        const eventsSnapshot = await getCountFromServer(eventsCollection);
        
        const pendingQuery = query(eventsCollection, where("status", "==", "pending"));
        const pendingSnapshot = await getCountFromServer(pendingQuery);

        setStats({
            totalUsers: usersSnapshot.data().count,
            totalEvents: eventsSnapshot.data().count,
            pendingEvents: pendingSnapshot.data().count,
        });

    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch dashboard data.",
      });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
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
      <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline my-6">Recent Activity</h2>
         <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
            <p className="text-muted-foreground">Recent activity log will be shown here.</p>
        </div>
      </div>
    </>
  );
}
