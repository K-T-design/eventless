
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
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  accountName: z.string().min(3, "Account name seems too short."),
  accountNumber: z.string().length(10, "Account number must be 10 digits."),
  bankName: z.string().min(1, "Please select a bank."),
});

export default function PayoutsSettingsPage() {
  const [loading, setLoading] = useState(false);
  
  // In a real app, you would fetch the user's existing payout details here
  // and use them as defaultValues.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Here you would typically save these details to Firestore
    console.log(values);
    
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Details Saved!",
            description: "Your payout information has been updated successfully.",
        });
        setLoading(false);
    }, 1000);
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
