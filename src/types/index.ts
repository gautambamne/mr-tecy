import { Timestamp, GeoPoint } from 'firebase/firestore';

export type UserRole = 'customer' | 'admin';

export interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    zipCode: string;
    geoPoint?: GeoPoint;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: UserRole;
    photoURL?: string | null;
    addresses: Address[];
    createdAt: Timestamp;
}

// Partner is now a Resource, not a User
export interface Partner {
    id: string;
    name: string;
    services: string[]; // IDs of services they perform
    bio: string;
    rating: number;
    reviewCount: number;
    availability: 'online' | 'offline';
    location: GeoPoint;
    contactInfo?: string;
    completedJobs: number; // For social proof
    priceMultiplier: number; // Pricing flexibility (e.g., 1.0 = base price, 1.2 = 20% premium)
    photoURL?: string; // Partner profile photo
}

export type ServiceCategory = 'Appliance' | 'Vehicle' | 'Electronics' | 'Plumbing' | 'Cleaning';

export interface Service {
    id: string;
    name: string;
    category: ServiceCategory;
    description: string;
    price: number;
    durationMinutes: number;
    iconUrl?: string;
    active: boolean;
}

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
    id: string;
    customerId: string;
    customerName: string; // Denormalized for display
    partnerId: string;
    partnerName: string; // Denormalized for display
    serviceId: string;
    serviceName: string; // Denormalized
    servicePrice: number; // Denormalized
    type: 'instant' | 'scheduled';
    status: BookingStatus;
    scheduledTime: Timestamp;
    location: Address;
    description: string; // Customer's issue description
    notes?: string; // Optional special instructions
    images: string[]; // Firebase Storage URLs for customer-uploaded images
    paymentMethod: 'COD'; // Fixed
    totalAmount: number;
    paymentStatus: 'pending' | 'paid';
    warrantyValidUntil?: Timestamp;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

// Customer review/feedback for completed bookings
export interface Review {
    id: string;
    bookingId: string;
    customerId: string;
    customerName: string; // Denormalized
    partnerId: string;
    partnerName: string; // Denormalized
    rating: number; // 1-5 stars
    feedback: string; // Customer comment
    createdAt: Timestamp;
}
