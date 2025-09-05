
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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { createSupportTicket } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";


const formSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters long.").max(100, "Subject is too long."),
  category: z.enum(['technical', 'billing', 'event_issue', 'other']),
  message: z.string().min(20, "Message must be at least 20 characters long."),
});

export default function ContactSupportPage() {
  const [loading, setLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "technical",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "You must be logged in to contact support.",
      });
      setLoading(false);
      router.push('/auth/signin');
      return;
    }

    try {
      const result = await createSupportTicket({
        subject: values.subject,
        message: values.message,
        category: values.category,
      });

      if (result.success) {
        toast({
          title: "Ticket Submitted!",
          description: "Our team has received your request and will get back to you shortly.",
        });
        router.push("/discover");
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Submitting Ticket",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-xl py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="container mx-auto max-w-lg py-12 px-4 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to contact support.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Contact Support</h1>
        <p className="text-muted-foreground mt-2">
          Have an issue? Fill out the form below and we'll help you out.
        </p>
      </div>
      <Card>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Issue with my ticket" {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing/Payment</SelectItem>
                        <SelectItem value="event_issue">Problem with an Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Please describe your issue in detail..." {...field} rows={8} />
                    </FormControl>
                    <FormDescription>
                      The more detail you can provide, the faster we can help.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
