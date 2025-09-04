
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Payout, UserProfile } from "@/types";
import { updatePayoutDetails, getPayoutHistoryForUser } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { NIGERIAN_BANKS } from "@/lib/banks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";


const formSchema = z.object({
  bankName: z.string().min(1, "Please select a bank."),
  otherBankName: z.string().optional(),
  accountNumber: z.string().length(10, "Account number must be 10 digits."),
  accountName: z.string().min(3, "Account name seems too short."),
}).refine(data => {
    if (data.bankName === 'Other' && (!data.otherBankName || data.otherBankName.length < 3)) {
        return false;
    }
    return true;
}, {
    message: "Please specify the bank name.",
    path: ["otherBankName"],
});

type PayoutFormValues = z.infer<typeof formSchema>;

export default function PayoutsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      otherBankName: "",
    },
  });

  const watchedBankName = form.watch("bankName");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setProfileLoading(true);
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
          setUserProfile(profile);
          // Set form defaults from fetched profile
          if (profile.bankDetails) {
            const isOtherBank = !NIGERIAN_BANKS.some(b => b.name === profile.bankDetails.bankName);
            form.reset({
              ...profile.bankDetails,
              bankName: isOtherBank ? 'Other' : profile.bankDetails.bankName,
              otherBankName: isOtherBank ? profile.bankDetails.bankName : '',
            });
          }
        }
        setProfileLoading(false);
      } else if (!authLoading) {
        setProfileLoading(false);
      }
    };
    
    const fetchHistory = async () => {
        if (user) {
            setHistoryLoading(true);
            const result = await getPayoutHistoryForUser(user.uid);
            if (result.success && result.data) {
                setPayoutHistory(result.data);
            }
            setHistoryLoading(false);
        }
    }

    fetchUserProfile();
    fetchHistory();
  }, [user, authLoading, form]);


  async function onSubmit(values: PayoutFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }
    setLoading(true);

    const finalBankName = values.bankName === 'Other' ? values.otherBankName : values.bankName;

    const result = await updatePayoutDetails(user.uid, {
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        bankName: finalBankName!,
    });

    if (result.success) {
      toast({
        title: "Details Saved!",
        description: "Your payout information has been updated successfully.",
      });
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setLoading(false);
  }
  
  const isLoading = authLoading || profileLoading;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold font-headline mb-4">Payout Details</h2>
            <p className="text-muted-foreground mb-8">
                This is where your earnings from ticket sales will be sent. Please ensure the details are correct.
            </p>
            {isLoading ? (
                 <div className="space-y-8">
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-12 w-32" />
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select your bank" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {NIGERIAN_BANKS.map(bank => (
                                <SelectItem key={bank.code} value={bank.name}>{bank.name}</SelectItem>
                                ))}
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {watchedBankName === 'Other' && (
                        <FormField
                            control={form.control}
                            name="otherBankName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Other Bank Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter your bank's name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="accountName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                            <Input placeholder="JOHN DOE" {...field} />
                            </FormControl>
                            <FormDescription>
                            This name should match the name on your bank account.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <Button type="submit" size="lg" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Details
                    </Button>
                    </form>
                </Form>
            )}
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Current Balance</CardTitle>
                    <CardDescription>This is the amount ready for your next payout.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-10 w-1/2" /> : (
                        <p className="text-3xl font-bold">₦{userProfile?.payouts?.balance.toLocaleString() ?? 0}</p>
                     )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                    {historyLoading ? (
                         <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : payoutHistory.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payoutHistory.map(payout => (
                                    <TableRow key={payout.id}>
                                        <TableCell>{format(payout.payoutDate, 'PP')}</TableCell>
                                        <TableCell className="text-right font-medium">₦{payout.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No payout history yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
