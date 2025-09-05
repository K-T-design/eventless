
"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAdmins } from "./actions";

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    setLoading(true);
    const result = await getAdmins();
    if (result.success && result.data) {
      setAdmins(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message || "Could not fetch admin data.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);
  
  const getRoleVariant = (role: 'super_admin' | 'admin') => {
    return role === 'super_admin' ? 'destructive' : 'default';
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Manage Administrators</h1>
      <Card>
         <CardHeader>
          <CardTitle>Admin & Super Admin Users</CardTitle>
          <CardDescription>This is a list of all users with elevated privileges on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : admins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.basicInfo.name}
                    </TableCell>
                    <TableCell>{user.basicInfo.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.basicInfo.userType as 'super_admin' | 'admin')} className="capitalize">
                          {user.basicInfo.userType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(user.metadata.dateCreated, "PPP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No admin users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
