"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ticket, User, LogOut, LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
         <Button>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-headline">Welcome to E-Ventless</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to continue to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <Button onClick={handleGoogleSignIn} variant="outline" size="lg">
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-67.4 64.8C297.7 99.8 274.9 88 248 88c-73.2 0-132.3 59.2-132.3 132.3s59.1 132.3 132.3 132.3c76.9 0 111.2-51.8 115.8-77.9H248v-62h239.5c3.3 15.2 4.5 30.8 4.5 46.8z"></path></svg>
              Sign in with Google
          </Button>
        </div>
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
