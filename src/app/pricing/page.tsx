import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Individual",
    price: "Free",
    priceSuffix: "",
    description: "Perfect for students and individuals getting started with event organization.",
    features: [
      "Up to 5 free events per month",
      "Basic event analytics",
      "Standard support",
    ],
    cta: "Get Started",
    variant: "secondary"
  },
  {
    name: "Individual Pro",
    price: "₦5,000",
    priceSuffix: "/ month",
    description: "For the serious individual organizer who needs more features and capacity.",
    features: [
      "Unlimited events",
      "Advanced event analytics",
      "Custom event URLs",
      "Priority support",
    ],
    cta: "Upgrade Now",
    variant: "default"
  },
  {
    name: "Organization",
    price: "₦15,000",
    priceSuffix: "/ month",
    description: "Tailored for clubs, departments, and larger student organizations.",
    features: [
      "Up to 8 free events per month",
      "Team member access (up to 5)",
      "Branded event pages",
      "Dedicated support",
    ],
    cta: "Choose Plan",
    variant: "secondary"
  },
];


export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 md:px-6">
       <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Find a Plan That's Right For You</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Whether you're organizing a small study group or a campus-wide festival, we have a plan that fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 ${tier.variant === 'default' ? 'border-primary ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <CardTitle className="font-headline">{tier.name}</CardTitle>
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
                     <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-1" />
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
