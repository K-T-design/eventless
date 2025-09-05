
'use server';

import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export async function getAdmins(): Promise<{ success: boolean; data?: UserProfile[]; message?: string }> {
  try {
    const usersCollection = collection(firestore, "users");
    
    const q = query(
        usersCollection, 
        where("basicInfo.userType", "in", ["admin", "super_admin"]),
        orderBy("basicInfo.userType", "desc"), // Show super_admins first
        orderBy("metadata.dateCreated", "desc")
    );

    const querySnapshot = await getDocs(q);
    const adminsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          metadata: {
            ...data.metadata,
            dateCreated: data.metadata.dateCreated?.toDate ? data.metadata.dateCreated.toDate() : new Date(),
          }
        } as UserProfile;
    });

    return { success: true, data: adminsList };

  } catch (error: any) {
    console.error("Error fetching admins:", error);
    return { success: false, message: error.message || "Failed to fetch admin users." };
  }
}
