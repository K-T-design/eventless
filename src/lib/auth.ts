
import { auth as firebaseAuth, firestore } from '@/lib/firebase';
import { type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

// This function is suitable for client-side use where auth state is readily available.
export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
}

// This function can be used on the server to get user profile data when you have a UID.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    const userDocRef = doc(firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
    }
    return null;
}
