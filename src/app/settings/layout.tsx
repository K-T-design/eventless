
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';

const settingsNav = [
    { name: "Profile", href: "/settings/profile" },
    { name: "Payouts", href: "/settings/payouts" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, profile, and payment details.
        </p>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <nav className="flex flex-col gap-1 md:col-span-1">
            {settingsNav.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === item.href
                            ? "bg-muted text-primary font-semibold"
                            : "hover:bg-muted/50"
                    )}
                >
                    {item.name}
                </Link>
            ))}
        </nav>
        <div className="md:col-span-3">
             <div className="bg-card p-8 rounded-lg shadow-sm">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
}
