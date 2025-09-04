
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  Wallet,
  Inbox,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";


export function AdminSidebar() {
  return (
    <aside className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold font-headline text-lg">
             <Image src="https://ik.imagekit.io/t48u898g8/eventless_logo-removebg-preview%20(2).png?updatedAt=1757007814945" alt="E-Ventless Logo" width={32} height={32} className="rounded-full" />
            <span>E-Ventless Admin</span>
          </Link>
        </div>
        <div className="flex-1">
            <AdminSidebarNav />
        </div>
      </div>
    </aside>
  );
}

export function AdminSidebarNav({ className }: { className?: string }) {
    const pathname = usePathname();
    const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const eventsRef = collection(firestore, "events");
                const pendingQuery = query(eventsRef, where("status", "==", "pending"));
                const pendingSnapshot = await getCountFromServer(pendingQuery);
                setPendingApprovalCount(pendingSnapshot.data().count);
            } catch (error) {
                console.error("Failed to fetch notification counts:", error);
            }
        };

        fetchCounts();
    }, []);

    const navItems = [
        { href: "/admin/dashboard", label: "Dashboard Home", icon: Home },
        { href: "/admin/approval-queue", label: "Approval Queue", icon: AlertCircle, count: pendingApprovalCount },
        { href: "/admin/user-management", label: "User Management", icon: Users },
        { href: "/admin/event-management", label: "Event Management", icon: Calendar },
        { href: "/admin/financials", label: "Financials", icon: Wallet },
        { href: "/admin/support-inbox", label: "Support Inbox", icon: Inbox },
    ];
    
    return (
        <nav className={cn("grid items-start px-2 text-sm font-medium lg:px-4", className)}>
            {navItems.map(item => (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === item.href && "bg-muted text-primary"
                    )}
                    >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.count && item.count > 0 ? (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            {item.count}
                        </Badge>
                    ) : null}
                </Link>
            ))}
        </nav>
    )
}
