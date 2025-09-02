
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Calendar as CalendarIcon, Upload, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/categories";


const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long.").max(500, "Description is too long."),
  university: z.string().min(1, "Please select a university."),
  category: z.string().min(1, "Please select a category."),
  location: z.string().min(3, "Location is required."),
  date: z.date({ required_error: "A date for the event is required." }),
  time: z.string().min(1, "Time is required (e.g., 9:00 AM)."),
  price: z.coerce.number().min(0, "Price cannot be negative.").default(0),
});

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      time: "",
      price: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to create an event."
        });
        setLoading(false);
        router.push('/auth/signin');
        return;
    }

    try {
        const randomImageId = Math.floor(Math.random() * 100);
        const newEvent = {
            ...values,
            organizerId: user.uid,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
            // TODO: Implement actual image upload
            imageUrl: `https://picsum.photos/1200/600?random=${randomImageId}`,
            imageHint: "event image",
        };

        const docRef = await addDoc(collection(firestore, "events"), newEvent);

        toast({
            title: "Event Submitted!",
            description: "Your event has been submitted for approval.",
        });
        
        form.reset();
        router.push(`/events/${docRef.id}`);

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
  
  // Mock user type and event count - we will replace this later
  const userType = "Individual";
  const eventsCreated = 2;
  const eventLimit = userType === "Individual" ? 5 : 8;
  const eventsLeft = eventLimit - eventsCreated;

  if (authLoading) {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!user && !authLoading) {
     return (
        <div className="container mx-auto max-w-3xl py-12 px-4 text-center">
             <h1 className="text-2xl font-bold font-headline mb-4">Access Denied</h1>
             <p className="text-muted-foreground mb-6">You need to be logged in to create an event.</p>
             <Button asChild>
                <a href="/auth/signin">Sign In</a>
             </Button>
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Create a New Event</h1>
        <p className="text-muted-foreground mt-2">
          Fill out the details below to get your event published.
        </p>
      </div>

      <Alert className="mb-8 bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Free Event Limit</AlertTitle>
        <AlertDescription>
          You have <strong>{eventsLeft}</strong> free events left this month.{" "}
          <a href="/pricing" className="underline font-medium">Upgrade</a> for unlimited events.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <SelectItem value="University of Lagos">University of Lagos</SelectItem>
                      <SelectItem value="University of Ibadan">University of Ibadan</SelectItem>
                      <SelectItem value="Covenant University">Covenant University</SelectItem>
                      <SelectItem value="Obafemi Awolowo University">Obafemi Awolowo University</SelectItem>
                      <SelectItem value="University of Nigeria, Nsukka">University of Nigeria, Nsukka</SelectItem>
                    </SelectContent>
                  </Select>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Price (₦)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter 0 for a free event" {...field} />
                  </FormControl>
                   <FormDescription>
                    A fee of ₦150 will be added at checkout for paid events.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>


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
          
          <FormItem>
              <FormLabel>Event Poster</FormLabel>
              <FormControl>
                  <div className="flex items-center justify-center w-full">
                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-muted-foreground"/>
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">SVG, PNG, JPG (MAX. 1200x600px)</p>
                          </div>
                          <input id="dropzone-file" type="file" className="hidden" accept="image/*" />
                      </label>
                  </div> 
              </FormControl>
               <FormDescription>
                  Image upload is not yet implemented. A random placeholder image will be used.
                </FormDescription>
              <FormMessage />
          </FormItem>

          <Button type="submit" size="lg" className="w-full" disabled={loading || authLoading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Approval
          </Button>
        </form>
      </Form>
    </div>
  );
}
