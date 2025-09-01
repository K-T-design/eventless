
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Ticket } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold font-headline text-lg">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span>E-Ventless Admin</span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center mx-auto">
          <Link
            href="/admin/dashboard"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
           <Link
            href="/discover"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View Live Site
          </Link>
        </nav>
        <div className="ml-auto">
          <Button variant="outline" onClick={() => signOut(auth)}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
