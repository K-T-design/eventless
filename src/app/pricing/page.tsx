
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "The Quick Host",
    price: "₦5,000",
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
  },
  {
    name: "The Hustler",
    price: "₦20,500",
    priceSuffix: "/ month",
    description: "For consistent creators building a community. Your month-to-month pass to unlimited events.",
    features: [
      "Unlimited Event Creation for 1 Month",
      "All Core Features Included",
      "Best for ongoing momentum",
    ],
    cta: "Choose Plan",
    variant: "default",
    planCode: "PLAN_CODE_MONTHLY", // Placeholder
  },
  {
    name: "The Strategist",
    price: "₦65,000",
    priceSuffix: "/ 4 months",
    description: "Plan your entire season ahead and save over 20% compared to the monthly plan.",
    features: [
      "Unlimited Event Creation for 4 Months",
      "All Core Features Included",
      "Save ₦16,500 vs. paying monthly",
    ],
    cta: "Choose Plan",
    variant: "secondary",
    planCode: "PLAN_CODE_QUARTERLY", // Placeholder
  },
  {
    name: "The Visionary",
    price: "₦155,000",
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
    planCode: "PLAN_CODE_YEARLY", // Placeholder
  },
];


export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6">
       <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Find a Plan That's Right For You</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Whether you're organizing a small study group or a campus-wide festival, we have a plan that fits your needs.
        </p>
      </div>

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
                <span className="text-4xl font-bold">{tier.price}</span>
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
              <Button className="w-full" variant={tier.variant as "default" | "secondary"}>
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
