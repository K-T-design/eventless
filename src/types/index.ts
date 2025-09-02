
import { Timestamp } from "firebase/firestore";

export type Event = {
  id: string;
  title: string;
  university: string;
  category: string;
  date: Date;
  time: string;
  location:string;
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
    status: 'active' | 'suspended';
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

export type Ticket = {
    id: string;
    eventId: string;
    userId: string;
    purchaseDate: Timestamp;
    status: 'valid' | 'used';
    qrCodeData: string; // The raw data for the QR code
    eventDetails?: { // Denormalized data for easier display
        title: string;
        date: Date;
        location: string;
    }
}

export type Transaction = {
    id: string;
    userId: string;
    ticketId: string;
    amount: number;
    status: 'succeeded' | 'failed' | 'pending';
    paymentGateway: 'paystack' | 'free' | 'other';
    transactionDate: Timestamp;
    // Paystack specific reference
    reference?: string;
}
