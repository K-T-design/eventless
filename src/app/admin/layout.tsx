
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/layout/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
          if (userProfile.basicInfo.userType === 'super_admin') {
            setIsSuperAdmin(true);
          } else {
            router.push('/'); // Redirect to home if not super admin
          }
        } else {
           router.push('/'); // Redirect if user profile doesn't exist
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push('/');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, router]);

  if (checkingAuth || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    // This part should ideally not be reached due to redirects, but serves as a final guard.
     return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Access Denied. You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
        <AdminHeader />
        <main className="container mx-auto max-w-7xl py-8 px-4 md:px-6">
            {children}
        </main>
    </div>
  )
}
