
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PaystackButton } from "react-paystack";
import { useState, useEffect } from "react";
import { updateUserSubscription } from "@/app/settings/profile/actions";
import Link from "next/link";

const tiers = [
  {
    name: "The Quick Host",
    price: 5000,
    priceSuffix: "/ week",
    description: "For pop-up events & quick tests. Unlimited, full-featured access for a full week.",
    features: [
      "Unlimited Event Creation for 7 Days",
      "Create events with multiple ticket tiers",
      "Secure payments via Paystack",
      "Scannable QR codes for check-in",
      "Real-time sales and revenue tracking",
      "Export attendee list",
      "Basic event analytics",
    ],
    cta: "Choose Plan",
    variant: "secondary",
    planCode: "PLN_8omcnih6dq1w4ma",
    durationDays: 7,
    planType: 'weekly',
  },
  {
    name: "The Hustler",
    price: 20500,
    priceSuffix: "/ month",
    description: "For consistent creators building a community. Your month-to-month pass to unlimited events.",
    features: [
      "Unlimited Event Creation for 1 Month",
      "All Core Features Included",
      "Best for ongoing momentum",
    ],
    cta: "Choose Plan",
    variant: "default",
    planCode: "PLN_3s46lkl33nyznbv",
    durationDays: 30,
    planType: 'monthly',
  },
  {
    name: "The Strategist",
    price: 65000,
    priceSuffix: "/ 4 months",
    description: "Plan your entire season ahead and save over 20% compared to the monthly plan.",
    features: [
      "Unlimited Event Creation for 4 Months",
      "All Core Features Included",
      "Save ₦16,500 vs. paying monthly",
    ],
    cta: "Choose Plan",
    variant: "secondary",
    planCode: "PLN_kyoqrpbi5tw72cd",
    durationDays: 120,
    planType: 'quarterly',
  },
  {
    name: "The Visionary",
    price: 155000,
    priceSuffix: "/ year",
    description: "The ultimate commitment for maximum growth, saving over 35% and eliminating renewal worries.",
     features: [
      "Unlimited Event Creation for 1 Full Year",
      "All Core Features Included",
      "Save ₦91,000 vs. paying monthly",
      "Priority customer support",
    ],
    cta: "Choose Plan",
    variant: "secondary",
    planCode: "PLN_c5qjp91xly1w54b",
    durationDays: 365,
    planType: 'yearly',
  },
];


export default function PricingPage() {
    const [user, authLoading] = useAuthState(auth);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [paystackPublicKey, setPaystackPublicKey] = useState("");
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        setPaystackPublicKey(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "");
    }, []);

    const handleSubscriptionSuccess = async (reference: string, planType: string, durationDays: number) => {
        if (!user) return;
        setProcessingPlan(planType);

        try {
            const result = await updateUserSubscription(user.uid, { reference, planType, durationDays });
            if (result.success) {
                toast({
                    title: "Subscription Activated!",
                    description: "Your new plan is now active. Enjoy!",
                });
                router.push("/organizer/dashboard");
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Activation Failed",
                description: `Your payment was successful but we failed to activate your subscription. Please contact support with reference: ${reference}. Error: ${error.message}`,
            });
        } finally {
            setProcessingPlan(null);
        }
    };
    
    const handleClose = () => {
        toast({
            variant: "destructive",
            title: "Payment Closed",
            description: "You closed the payment window without completing the subscription.",
        });
    };

    if (authLoading) {
      return (
        <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      )
    }

    return (
        <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline">Find a Plan That's Right For You</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Whether you're organizing a small study group or a campus-wide festival, we have a plan that fits your needs.
            </p>
        </div>

        {!user && (
            <div className="text-center mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <p className="text-yellow-800">Please <Link href="/auth/signin?redirect=/pricing" className="font-bold underline">sign in</Link> or <Link href="/auth/signup" className="font-bold underline">create an account</Link> to subscribe to a plan.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tiers.map((tier) => (
            <Card key={tier.name} className={cn(
                "flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300",
                tier.variant === 'default' && 'border-primary ring-2 ring-primary'
                )}>
                <CardHeader>
                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                <div className="mb-6">
                    <span className="text-4xl font-bold">₦{tier.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">{tier.priceSuffix}</span>
                </div>
                <ul className="space-y-3">
                    {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                        <span className="text-sm">{feature}</span>
                    </li>
                    ))}
                </ul>
                </CardContent>
                <CardFooter>
                 <PaystackButton
                    className="w-full"
                    plan={tier.planCode}
                    email={user?.email || ""}
                    reference={new Date().getTime().toString()}
                    onSuccess={(res) => handleSubscriptionSuccess(res.reference, tier.planType, tier.durationDays)}
                    onClose={handleClose}
                    disabled={!user || processingPlan === tier.planType}
                 >
                    <Button className="w-full" variant={tier.variant as "default" | "secondary"} disabled={!user || !!processingPlan}>
                        {processingPlan === tier.planType ? <Loader2 className="animate-spin"/> : tier.cta}
                    </Button>
                 </PaystackButton>
                </CardFooter>
            </Card>
            ))}
        </div>
        </div>
    );
}
