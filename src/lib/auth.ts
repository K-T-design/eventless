
import { auth as firebaseAuth } from '@/lib/firebase';
import { type User } from 'firebase/auth';

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
