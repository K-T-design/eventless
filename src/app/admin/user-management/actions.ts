
'use server';

import { collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer, doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export async function getUsers(page: number = 1, pageSize: number = 10): Promise<{ users: UserProfile[], totalCount: number }> {
  try {
    const usersCollection = collection(firestore, "users");
    
    // Get total count for pagination
    const countSnapshot = await getCountFromServer(usersCollection);
    const totalCount = countSnapshot.data().count;

    // Base query
    let q = query(usersCollection, orderBy("metadata.dateCreated", "desc"), limit(pageSize));

    // Pagination logic
    if (page > 1) {
      const lastVisibleDocQuery = query(usersCollection, orderBy("metadata.dateCreated", "desc"), limit((page - 1) * pageSize));
      const lastVisibleDocSnapshot = await getDocs(lastVisibleDocQuery);
      const lastVisible = lastVisibleDocSnapshot.docs[lastVisibleDocSnapshot.docs.length - 1];
      if (lastVisible) {
        q = query(usersCollection, orderBy("metadata.dateCreated", "desc"), startAfter(lastVisible), limit(pageSize));
      }
    }

    const querySnapshot = await getDocs(q);
    const usersList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          metadata: {
            ...data.metadata,
            // Ensure dateCreated is a Date object, handling server timestamps
            dateCreated: data.metadata.dateCreated?.toDate ? data.metadata.dateCreated.toDate() : new Date(),
          }
        } as UserProfile;
      });

    return { users: usersList, totalCount };

  } catch (error: any) {
    console.error("Error fetching paginated users:", error);
    // In case of an error, return empty state to prevent crash
    return { users: [], totalCount: 0 };
  }
}

export async function updateUserStatus(userId: string, currentStatus: 'active' | 'suspended') {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { "basicInfo.status": newStatus });
      return { success: true, message: `User status updated to ${newStatus}.` };
    } catch (error: any) {
       console.error(`Error updating user ${userId}: `, error);
       return { success: false, message: "Could not update the user's status." };
    }
}
