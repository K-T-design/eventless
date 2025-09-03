
'use server';

import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

type ProfileDetails = {
    name: string;
    phone: string;
}

export async function updateProfileDetails(userId: string, details: ProfileDetails) {
  try {
    const userRef = doc(firestore, "users", userId);
   
    await updateDoc(userRef, { 
      "basicInfo.name": details.name,
      "basicInfo.phone": details.phone,
    });

    revalidatePath('/settings/profile');

    return { success: true, message: `Profile details updated successfully.` };
  } catch (error: any) {
    console.error("Error updating profile details:", error);
    return { success: false, message: error.message || "Failed to update details." };
  }
}
