
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
import { Loader2 } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { updateProfileDetails } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  phone: z.string().regex(/^\+234[789][01]\d{8}$/, "Enter a valid Nigerian phone number (e.g., +23480...)."),
});

type ProfileFormValues = z.infer<typeof formSchema>;

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
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
            </div>
            <Skeleton className="h-12 w-32" />
        </div>
    )
  }

  return (
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
  );
}
