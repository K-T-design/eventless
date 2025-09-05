
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, User, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { UserProfile, UserType, OrgType } from "@/types";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  userType: z.enum(["individual", "organizer"]),
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().regex(/^\+234[789][01]\d{8}$/, "Enter a valid Nigerian phone number (e.g., +23480...)."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  orgName: z.string().optional(),
  orgType: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
    if (data.userType === 'organizer') {
        return !!data.orgName && data.orgName.length > 0;
    }
    return true;
}, {
    message: "Organization name is required.",
    path: ["orgName"],
}).refine((data) => {
    if (data.userType === 'organizer') {
        return !!data.orgType && data.orgType.length > 0;
    }
    return true;
}, {
    message: "Organization type is required.",
    path: ["orgType"],
});

type SignUpFormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: "individual",
      fullName: "",
      email: "",
      phone: "+234",
      password: "",
      confirmPassword: "",
    },
  });
  
  const userType = form.watch("userType");

  async function onSubmit(values: SignUpFormValues) {
    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Create user document in Firestore
      const userDoc: UserProfile = {
        id: user.uid,
        basicInfo: {
          email: values.email,
          name: values.fullName,
          phone: values.phone,
          userType: values.userType as UserType,
          status: "active",
        },
        subscription: {
          status: "inactive",
          planType: null,
          expiryDate: null,
          freeEventsUsed: 0,
        },
        bankDetails: {
            accountNumber: "",
            bankName: "",
            accountName: "",
        },
        payouts: {
            balance: 0,
            status: 'none',
            lastPayoutDate: null,
        },
        metadata: {
          dateCreated: serverTimestamp() as any,
          lastLogin: serverTimestamp() as any,
        },
      };

      if (values.userType === 'organizer') {
        userDoc.orgInfo = {
          orgName: values.orgName!,
          orgType: values.orgType! as OrgType,
        };
      }
      
      await setDoc(doc(firestore, "users", user.uid), userDoc);

      toast({
        title: "Account Created!",
        description: "Welcome to E-Ventless.",
      });
      router.push("/discover");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.code === 'auth/email-already-in-use' 
            ? "This email is already registered. Please sign in."
            : error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUserTypeSelect = (type: UserType) => {
    form.setValue("userType", type);
    setStep(2);
  };
  
  const orgTypes: OrgType[] = ["Student Union", "University Department", "Club/Society", "Business", "Other"];

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Create Your Account</CardTitle>
          <CardDescription>
            {step === 1 ? "First, tell us who you are." : "Just a few more details to get you started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                    className="p-6 text-center cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                    onClick={() => handleUserTypeSelect('individual')}
                >
                    <User className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="font-bold text-lg">I'm an Attendee</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        I want to discover events and buy tickets. I might also host small events.
                    </p>
                </Card>
                 <Card 
                    className="p-6 text-center cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                    onClick={() => handleUserTypeSelect('organizer')}
                >
                    <Building className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="font-bold text-lg">I'm an Organizer</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        I represent a group or business and want to host professional events.
                    </p>
                </Card>
             </div>
          )}

          {step === 2 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <div 
                    className={cn(
                        "p-3 rounded-md border text-sm font-medium flex items-center gap-3",
                        userType === 'individual' ? "bg-secondary/20 border-secondary text-primary" : "bg-primary/10 border-primary text-primary"
                    )}
                >
                    {userType === 'individual' ? <User className="h-5 w-5"/> : <Building className="h-5 w-5"/>}
                    You're signing up as an <span className="font-bold capitalize">{userType}</span>.
                    <Button variant="link" size="sm" className="ml-auto p-0 h-auto" onClick={() => setStep(1)}>Change</Button>
                </div>


                <FormField
                  control={form.control}
                  name="fullName"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@uni.edu.ng" {...field} />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {userType === 'organizer' && (
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold text-center">Organization Details</h3>
                        <FormField
                            control={form.control}
                            name="orgName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., UNILAG Tech Club" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="orgType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Organization Type</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {orgTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/signin" passHref>
               <Button variant="link" className="p-0 h-auto">Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
