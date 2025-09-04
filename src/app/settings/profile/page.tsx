
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
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { updateProfileDetails } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

const formSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  phone: z.string().regex(/^\+234[789][01]\d{8}$/, "Enter a valid Nigerian phone number (e.g., +23480...)."),
});

type ProfileFormValues = z.infer<typeof formSchema>;

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "+234",
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setProfileLoading(true);
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as UserProfile;
          setUserProfile(profile);
          form.reset({
            name: profile.basicInfo.name,
            phone: profile.basicInfo.phone,
          });
        }
        setProfileLoading(false);
      } else if (!authLoading) {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, authLoading, form]);


  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }
    setLoading(true);
    const result = await updateProfileDetails(user.uid, values);
    if (result.success) {
      toast({
        title: "Details Saved!",
        description: "Your profile information has been updated successfully.",
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

  if (isLoading) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
            </div>
             <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-32" />
        </div>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Profile Information</h2>
        <p className="text-muted-foreground mb-8">
          Update your personal details here. Your email address cannot be changed.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be a valid Nigerian phone number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>

      <Separator />

       <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Subscription Status</h2>
        <p className="text-muted-foreground mb-6">
            View your current subscription plan and status.
        </p>
        <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                     <CardTitle className="flex items-center gap-2">
                        <Crown className="text-primary" />
                        <span>Your Plan</span>
                    </CardTitle>
                    <CardDescription>
                        {userProfile?.subscription?.status === 'active' 
                            ? "You have access to all features."
                            : "Upgrade to unlock unlimited event creation and more."
                        }
                    </CardDescription>
                </div>
                <Button asChild variant="secondary" size="sm">
                    <Link href="/pricing">
                        {userProfile?.subscription?.status === 'active' ? "Change Plan" : "Upgrade Plan"}
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
               {userProfile?.subscription?.status === 'active' ? (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
                    <div>
                        <p className="text-muted-foreground">Plan Type</p>
                        <p className="font-semibold capitalize">{userProfile.subscription.planType}</p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Status</p>
                         <Badge variant="default" className="capitalize">{userProfile.subscription.status}</Badge>
                    </div>
                    {userProfile.subscription.expiryDate && (
                         <div>
                            <p className="text-muted-foreground">Expires On</p>
                            <p className="font-semibold">{format(userProfile.subscription.expiryDate.toDate(), 'PPP')}</p>
                        </div>
                    )}
                </div>
               ) : (
                <div className="text-center py-4">
                    <p className="font-semibold">You are currently on the Free Plan.</p>
                </div>
               )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
