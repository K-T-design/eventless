
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
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { updatePayoutDetails } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

const formSchema = z.object({
  bankName: z.string().min(1, "Please select a bank."),
  accountNumber: z.string().length(10, "Account number must be 10 digits."),
  accountName: z.string().min(3, "Account name seems too short."),
});

type PayoutFormValues = z.infer<typeof formSchema>;

export default function PayoutsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
  });

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
            form.reset(profile.bankDetails);
          }
        }
        setProfileLoading(false);
      } else if (!authLoading) {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, authLoading, form]);


  async function onSubmit(values: PayoutFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }
    setLoading(true);
    const result = await updatePayoutDetails(user.uid, values);
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

  if (authLoading || profileLoading) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
            </div>
             <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-32" />
        </div>
    )
  }

  return (
    <div>
       <h2 className="text-2xl font-bold font-headline mb-4">Payout Details</h2>
       <p className="text-muted-foreground mb-8">
        This is where your earnings from ticket sales will be sent. Please ensure the details are correct.
      </p>

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
                    <SelectItem value="Guaranty Trust Bank">Guaranty Trust Bank</SelectItem>
                    <SelectItem value="First Bank of Nigeria">First Bank of Nigeria</SelectItem>
                    <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                    <SelectItem value="Access Bank">Access Bank</SelectItem>
                    <SelectItem value="United Bank for Africa">United Bank for Africa</SelectItem>
                     <SelectItem value="Kuda MFB">Kuda MFB</SelectItem>
                    <SelectItem value="Opay">Opay</SelectItem>
                    <SelectItem value="Palmpay">Palmpay</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
    </div>
  );
}
