
"use client";

import { useEffect, useState } from "react";
import type { UserProfile, UserType } from "@/types";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getUsers, updateUserStatus, updateUserRole } from "./actions";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 15;

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userToEditRole, setUserToEditRole] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserType | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      const { users: fetchedUsers, totalCount } = await getUsers(page, PAGE_SIZE);
      setUsers(fetchedUsers);
      setTotalUsers(totalCount);
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
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleUserStatusChange = async (userId: string, currentStatus: 'active' | 'suspended') => {
    const result = await updateUserStatus(userId, currentStatus);
    if(result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      fetchUsers(currentPage);
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };
  
  const handleRoleChange = async () => {
    if (!userToEditRole || !newRole) return;
    setIsUpdatingRole(true);
    const result = await updateUserRole(userToEditRole.id, newRole);
    if(result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      setUserToEditRole(null);
      setNewRole(null);
      fetchUsers(currentPage);
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsUpdatingRole(false);
  }

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  if (loading && users.length === 0) {
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
                         <Button size="sm" variant="outline" onClick={() => { setUserToEditRole(user); setNewRole(user.basicInfo.userType); }}>Change Role</Button>
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
        <CardFooter className="flex items-center justify-between py-4">
             <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
             </span>
            <div className="flex gap-2">
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                </Button>
            </div>
        </CardFooter>
      </Card>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{selectedUser.basicInfo.name}</DialogTitle>
              <DialogDescription>
                User ID: {selectedUser.id}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6 py-4 text-sm">
                    
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base text-foreground">Account Information</h3>
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
                    </div>

                     {selectedUser.basicInfo.userType === 'organizer' && selectedUser.orgInfo && (
                        <div>
                            <Separator className="my-4" />
                            <h3 className="font-semibold text-base text-foreground mb-4">Organization Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-muted-foreground">Org. Name</span>
                                    <span className="col-span-2 font-medium">{selectedUser.orgInfo.orgName}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-muted-foreground">Org. Type</span>
                                    <span className="col-span-2 font-medium">{selectedUser.orgInfo.orgType}</span>
                                </div>
                            </div>
                        </div>
                     )}

                    <div>
                        <Separator className="my-4" />
                        <h3 className="font-semibold text-base text-foreground mb-4">Financials</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-muted-foreground">Payout Balance</span>
                                <span className="col-span-2 font-medium">₦{selectedUser.payouts?.balance?.toLocaleString() ?? 0}</span>
                            </div>
                            {selectedUser.bankDetails?.accountNumber ? (
                               <>
                                 <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-muted-foreground">Bank Name</span>
                                    <span className="col-span-2 font-medium">{selectedUser.bankDetails.bankName}</span>
                                </div>
                                 <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-muted-foreground">Account Name</span>
                                    <span className="col-span-2 font-medium">{selectedUser.bankDetails.accountName}</span>
                                </div>
                                 <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-muted-foreground">Account Number</span>
                                    <span className="col-span-2 font-medium">{selectedUser.bankDetails.accountNumber}</span>
                                </div>
                               </>
                            ) : (
                                 <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-muted-foreground">Bank Details</span>
                                    <span className="col-span-2 text-muted-foreground italic">Not provided</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {userToEditRole && (
        <Dialog open={!!userToEditRole} onOpenChange={(isOpen) => !isOpen && setUserToEditRole(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Role for {userToEditRole.basicInfo.name}</DialogTitle>
                    <DialogDescription>Select a new role for this user. This action can have significant security implications.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Select onValueChange={(value: UserType) => setNewRole(value)} defaultValue={userToEditRole.basicInfo.userType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="organizer">Organizer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setUserToEditRole(null)}>Cancel</Button>
                    <Button onClick={handleRoleChange} disabled={isUpdatingRole}>
                        {isUpdatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
