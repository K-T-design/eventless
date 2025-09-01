
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Inbox } from "lucide-react";

export default function SupportInboxPage() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Support Inbox</h1>
      <Card>
        <CardHeader>
            <CardTitle>Manage User Support</CardTitle>
            <CardDescription>Review, manage, and respond to user-submitted tickets and reports.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Support Inbox Coming Soon</h3>
                <p className="text-muted-foreground">This section will display user support tickets once the functionality is implemented.</p>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
