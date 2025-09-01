
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";

// Add a uid to the local type for mapping
type UserProfileWithId = UserProfile & { id: string };

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(firestore, "users");
      const q = query(usersCollection);
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map((doc) => {
        const data = doc.data() as UserProfile;
        return {
          id: doc.id,
          ...data,
        } as UserProfileWithId;
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch user data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusVariant = (status: 'active' | 'suspended') => {
    switch (status) {
        case 'active':
            return 'default';
        case 'suspended':
            return 'destructive';
        default:
            return 'secondary';
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">User Management</h1>
      <Card>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.basicInfo.name}
                    </TableCell>
                    <TableCell>{user.basicInfo.email}</TableCell>
                    <TableCell className="capitalize">{user.basicInfo.userType.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {format(user.metadata.dateCreated.toDate(), "PPP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.basicInfo.status)} className="capitalize">
                        {user.basicInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="destructive">Suspend</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
