
import { Timestamp } from "firebase/firestore";

export type Event = {
  id: string;
  title: string;
  university: string;
  date: Date;
  time: string;
  location: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  organizerId: string;
  createdAt: Timestamp;
};

export type UserType = 'individual' | 'organizer' | 'super_admin';

export type OrgType = 'Student Union' | 'University Department' | 'Club/Society' | 'Business' | 'Other';

export interface UserProfile {
  basicInfo: {
    email: string;
    name: string;
    phone: string;
    userType: UserType;
  };
  subscription: {
    status: 'inactive' | 'active' | 'expired';
    planType: 'monthly' | 'quarterly' | 'yearly' | null;
    expiryDate: Timestamp | null;
    freeEventsUsed: number;
  };
  orgInfo?: {
    orgName: string;
    orgType: OrgType;
    bankDetails: {
      accountNumber: string;
      bankName: string;
      accountName: string;
    };
  };
  metadata: {
    dateCreated: Timestamp;
    lastLogin: Timestamp;
  };
}
