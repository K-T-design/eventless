"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ticket, LogOut, LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            toast({ title: "Account Created", description: "You have been successfully signed up." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({ title: "Signed In", description: "You have been successfully signed in." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign In Failed", description: error.message });
        }
    };

    return (
        <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center font-headline">Welcome Back</DialogTitle>
                        <DialogDescription className="text-center">
                            Sign in to continue to your account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-signin" className="text-right">Email</Label>
                            <Input id="email-signin" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password-signin" className="text-right">Password</Label>
                            <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full">Sign In</Button>
                    </DialogFooter>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center font-headline">Create an Account</DialogTitle>
                        <DialogDescription className="text-center">
                           Enter your email and password to get started.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-signup" className="text-right">Email</Label>
                            <Input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password-signup" className="text-right">Password</Label>
                            <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" required minLength={6} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full">Sign Up</Button>
                    </DialogFooter>
                </form>
            </TabsContent>
        </Tabs>
    );
}


function AuthButtons() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />;
  }

  if (error) {
    console.error("Auth error:", error);
    return <p className="text-destructive">Error</p>;
  }

  if (user) {
    return (
       <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/check-in">Event Check-in</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/payouts">Payout Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
    );
  }


  return (
    <Dialog>
      <DialogTrigger asChild>
         <Button>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <AuthForm />
      </DialogContent>
    </Dialog>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
          <Ticket className="h-6 w-6 text-primary" />
          <span>E-Ventless</span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center mx-auto">
          <Link
            href="/discover"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Discover
          </Link>
          <Link
            href="/create-event"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Create Event
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>
        <div className="ml-auto">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
