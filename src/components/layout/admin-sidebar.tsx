
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

export function AdminSidebar() {
  return (
    <aside className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold font-headline text-lg">
            <LayoutDashboard className="h-6 w-6 text-primary" />
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
    // These counts would be fetched from the database in a real scenario
    const pendingApprovalCount = 6;
    const supportInboxCount = 12;

    const navItems = [
        { href: "/admin/dashboard", label: "Dashboard Home", icon: Home },
        { href: "/admin/approval-queue", label: "Approval Queue", icon: AlertCircle, count: pendingApprovalCount },
        { href: "/admin/user-management", label: "User Management", icon: Users },
        { href: "/admin/event-management", label: "Event Management", icon: Calendar },
        { href: "/admin/financials", label: "Financials", icon: Wallet },
        { href: "/admin/support-inbox", label: "Support Inbox", icon: Inbox, count: supportInboxCount },
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
                    {item.count && (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            {item.count}
                        </Badge>
                    )}
                </Link>
            ))}
        </nav>
    )
}
