
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, doc, updateDoc } from "firebase/firestore";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(firestore, "users");
      const q = query(usersCollection);
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          metadata: {
            ...data.metadata,
            dateCreated: data.metadata.dateCreated.toDate(),
          }
        } as UserProfile;
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

  const handleUserStatusChange = async (userId: string, currentStatus: 'active' | 'suspended') => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { "basicInfo.status": newStatus });
      toast({
        title: "Success",
        description: `User has been ${newStatus}.`,
      });
      // Refresh the list after update by changing local state
      setUsers(users.map(u => u.id === userId ? { ...u, basicInfo: { ...u.basicInfo, status: newStatus } } : u));
    } catch (error) {
       console.error(`Error updating user ${userId}: `, error);
       toast({
        variant: "destructive",
        title: "Error",
        description: `Could not update the user's status.`,
      });
    }
  };

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
                      {format(user.metadata.dateCreated, "PPP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.basicInfo.status)} className="capitalize">
                        {user.basicInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>View</Button>
                        <Button 
                          size="sm" 
                          variant={user.basicInfo.status === 'active' ? 'destructive' : 'secondary'}
                          onClick={() => handleUserStatusChange(user.id, user.basicInfo.status)}
                        >
                           {user.basicInfo.status === 'active' ? 'Suspend' : 'Unsuspend'}
                        </Button>
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

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{selectedUser.basicInfo.name}</DialogTitle>
              <DialogDescription>
                User ID: {selectedUser.id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Email</span>
                    <span className="col-span-2 font-medium">{selectedUser.basicInfo.email}</span>
                </div>
                 <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="col-span-2 font-medium">{selectedUser.basicInfo.phone}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">User Type</span>
                    <span className="col-span-2 font-medium capitalize">{selectedUser.basicInfo.userType.replace('_', ' ')}</span>
                </div>
                 <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Status</span>
                     <Badge variant={getStatusVariant(selectedUser.basicInfo.status)} className="capitalize w-fit">
                        {selectedUser.basicInfo.status}
                      </Badge>
                </div>
                 <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Date Joined</span>
                    <span className="col-span-2 font-medium">{format(selectedUser.metadata.dateCreated, "PPP")}</span>
                </div>
                 {selectedUser.orgInfo && (
                    <>
                         <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Org. Name</span>
                            <span className="col-span-2 font-medium">{selectedUser.orgInfo.orgName}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Org. Type</span>
                            <span className="col-span-2 font-medium">{selectedUser.orgInfo.orgType}</span>
                        </div>
                    </>
                 )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
