
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

const SUPER_ADMIN_ONLY_PAGES = [
  '/admin/user-management',
  '/admin/financials',
  '/admin/support-inbox',
  '/admin/manage-admins'
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
          const profile = userDocSnap.data() as UserProfile;
          setUserProfile(profile);
          const userType = profile.basicInfo.userType;
          
          if (userType !== 'super_admin' && userType !== 'admin') {
             router.push('/'); // Not an admin at all
             return;
          }

          // If a regular admin tries to access a super_admin page, redirect them
          if (userType === 'admin' && SUPER_ADMIN_ONLY_PAGES.some(page => pathname.startsWith(page))) {
            router.push('/admin/dashboard');
            return;
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
  }, [user, authLoading, router, pathname]);

  if (checkingAuth || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile || !['super_admin', 'admin'].includes(userProfile.basicInfo.userType)) {
     return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Access Denied. You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AdminSidebar userProfile={userProfile} />
      <div className="flex flex-col">
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            {children}
        </main>
      </div>
    </div>
  )
}
