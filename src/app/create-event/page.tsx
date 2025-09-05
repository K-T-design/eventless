
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Calendar as CalendarIcon, Loader2, Trash2, PlusCircle, Shield } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/lib/firebase";
import { collection, writeBatch, doc, getDoc, increment, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { NIGERIAN_UNIVERSITIES } from "@/lib/universities";
import type { UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const ticketTierSchema = z.object({
  name: z.string().min(1, "Tier name is required."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  description: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").max(100, "Title is too long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  university: z.string().min(1, "Please select a university."),
  category: z.string().min(1, "Please select a category."),
  location: z.string().min(3, "Location is required."),
  date: z.date({ required_error: "A date for the event is required." }),
  time: z.string().min(1, "Time is required (e.g., 9:00 AM)."),
  poster: z.string().optional(),
  ticketTiers: z.array(ticketTierSchema).min(1, "You must add at least one ticket tier."),
});

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
        if (user) {
            setProfileLoading(true);
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserProfile({ id: userDocSnap.id, ...userDocSnap.data() } as UserProfile);
            }
            setProfileLoading(false);
        } else if (!authLoading) {
            setProfileLoading(false);
        }
    };
    fetchUserProfile();
  }, [user, authLoading]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      time: "",
      ticketTiers: [{ name: "Regular", price: 0, quantity: 100, description: "Standard Admission" }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ticketTiers",
  });
  
  const isAdmin = userProfile?.basicInfo.userType === 'super_admin' || userProfile?.basicInfo.userType === 'admin';

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    if (!user || !userProfile) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to create an event."
        });
        setLoading(false);
        router.push('/auth/signin');
        return;
    }
    
    // Check for active subscription or admin role
    const hasActiveSubscription = userProfile.subscription.status === 'active';

    if (!isAdmin && !hasActiveSubscription) {
        const isOrg = userProfile.basicInfo.userType === 'organizer';
        const limit = isOrg ? 8 : 5;
        const eventsUsed = userProfile.subscription.freeEventsUsed;

        if (eventsUsed >= limit) {
            toast({
                variant: "destructive",
                title: "Free Limit Reached",
                description: `You have used all your free events for this month. Please upgrade your plan.`,
            });
            setLoading(false);
            return;
        }
    }


    try {
        const batch = writeBatch(firestore);

        const newEventRef = doc(collection(firestore, "events"));
        const newEventData = {
            title: values.title,
            description: values.description,
            university: values.university,
            category: values.category,
            location: values.location,
            date: values.date,
            time: values.time,
            organizerId: user.uid,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
            imageUrl: "https://picsum.photos/1200/600",
            imageHint: "event poster placeholder",
        };
        batch.set(newEventRef, newEventData);

        values.ticketTiers.forEach(tier => {
            const tierRef = doc(collection(firestore, `events/${newEventRef.id}/ticketTiers`));
            batch.set(tierRef, tier);
        });

        // Only increment free event counter if user is not admin and does NOT have an active subscription
        if (!isAdmin && !hasActiveSubscription) {
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { 'subscription.freeEventsUsed': increment(1) });
        }
        
        await batch.commit();

        toast({
            title: "Event Submitted!",
            description: "Your event has been submitted for approval.",
        });
        
        form.reset();
        router.push(`/events/${newEventRef.id}`);

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error Creating Event",
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }
  
  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!user && !isLoading) {
     return (
        <div className="container mx-auto max-w-3xl py-12 px-4 text-center">
             <h1 className="text-2xl font-bold font-headline mb-4">Access Denied</h1>
             <p className="text-muted-foreground mb-6">You need to be logged in to create an event.</p>
             <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
             </Button>
        </div>
    )
  }
  
  const isSubscribed = userProfile?.subscription.status === 'active';
  const eventLimit = userProfile?.basicInfo.userType === 'organizer' ? 8 : 5;
  const eventsUsed = userProfile?.subscription.freeEventsUsed ?? 0;
  const eventsLeft = Math.max(0, eventLimit - eventsUsed);
  const canCreateEvent = isAdmin || isSubscribed || eventsLeft > 0;

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Create a New Event</h1>
        <p className="text-muted-foreground mt-2">
          Fill out the details below to get your event published.
        </p>
      </div>

       {isAdmin ? (
            <Alert className="mb-8 bg-green-50 border-green-200 text-green-800">
                 <Shield className="h-4 w-4 text-green-600" />
                <AlertTitle className="font-bold">Admin Mode</AlertTitle>
                <AlertDescription>
                    Event creation limits do not apply to your account.
                </AlertDescription>
            </Alert>
       ) : userProfile ? (
            <Alert className="mb-8 bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">
                    {isSubscribed ? `Plan: ${userProfile.subscription.planType}` : "Free Event Limit"}
                </AlertTitle>
                <AlertDescription>
                 {isSubscribed 
                    ? `Your subscription is active! You have unlimited event creations.`
                    : <>You have <strong>{eventsLeft}</strong> free events left this month.{" "}<Link href="/pricing" className="underline font-medium">Upgrade</Link> for unlimited events.</>
                 }
                </AlertDescription>
            </Alert>
       ) : (
            <Skeleton className="h-20 w-full mb-8" />
       )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6 p-6 border rounded-lg">
                <h2 className="text-xl font-bold font-headline">Core Details</h2>
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Tech Innovators Conference" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Event Description</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Tell us more about your event..." {...field} rows={5} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Event Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {EVENT_CATEGORIES.map(category => (
                                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormItem>
                    <FormLabel>Event Poster</FormLabel>
                    <FormControl>
                       <Input disabled placeholder="Image uploads will be enabled soon." />
                    </FormControl>
                    <FormDescription>
                        A placeholder image will be used for now.
                    </FormDescription>
                </FormItem>
            </div>

            <div className="space-y-6 p-6 border rounded-lg">
                <h2 className="text-xl font-bold font-headline">Date, Time & Location</h2>
                 <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>University</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select the host university" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {NIGERIAN_UNIVERSITIES.map(uni => (
                                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location / Venue</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Main Auditorium" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 9:00 AM - 5:00 PM" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            
            <div className="space-y-6 p-6 border rounded-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-headline">Ticket Configuration</h2>
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", price: 0, quantity: 1, description: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Tier
                    </Button>
                </div>
                 <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md bg-muted/50 space-y-4 relative">
                            <FormField
                                control={form.control}
                                name={`ticketTiers.${index}.name`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tier Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Regular, VIP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`ticketTiers.${index}.price`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price (₦)</FormLabel>
                                        <FormControl>
                                        <Input type="number" placeholder="0 for free" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`ticketTiers.${index}.quantity`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                        <Input type="number" placeholder="100" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                             <FormField
                                control={form.control}
                                name={`ticketTiers.${index}.description`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Includes front-row seating" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <FormMessage>{form.formState.errors.ticketTiers?.root?.message}</FormMessage>
                </div>
            </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading || isLoading || !canCreateEvent}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Approval
          </Button>
        </form>
      </Form>
    </div>
  );
}
