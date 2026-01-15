export type UserRole = 'passenger' | 'driver' | 'admin' | 'guest';

export interface DailyRoute {
  origin: string;
  destination: string;
  active: boolean;
}

export interface WeeklySchedule {
  monday: DailyRoute;
  tuesday: DailyRoute;
  wednesday: DailyRoute;
  thursday: DailyRoute;
  friday: DailyRoute;
  saturday: DailyRoute;
  sunday: DailyRoute;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePhoto?: string; // New: Profile picture URL/Name
  vehiclePlate?: string; // Only for drivers
  idNumber?: string; // Bilhete de Identidade for passengers
  licensePhoto?: string; // Driver's license photo name/url
  status?: 'active' | 'pending' | 'suspended'; // Account status
  balance?: number; // Virtual wallet/earnings
  currentLocation?: string; // Where the driver is currently located
  rating?: number; // Driver rating (4.8, 5.0, etc.)
  schedule?: WeeklySchedule; // Driver's default weekly schedule
  specificSchedule?: Record<string, DailyRoute>; // Date format 'YYYY-MM-DD' -> Route override
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  price: number;
}

export type ParcelSize = 'Pequeno' | 'Médio' | 'Grande';

export interface Trip {
  id: string;
  routeId: string;
  driverId: string | null;
  passengerId: string;
  date: string; // ISO date string
  seats: number;
  type: 'passenger' | 'parcel';
  // waiting_quote: Passenger sent parcel, Admin needs to set price
  // quote_received: Admin set price, Passenger needs to accept/pay
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'waiting_quote' | 'quote_received';
  totalPrice: number;
  commission: number; // 15%
  driverEarnings: number; // 85%
  paymentMethod?: 'M-Pesa' | 'E-Mola' | 'Cash'; 
  parcelDetails?: {
    size: ParcelSize;
    description: string;
  };
  // Feedback fields
  rating?: number; // 1 to 5 stars
  feedbackTags?: string[]; // e.g., ["Condução Segura", "Simpático"]
}

export interface StatData {
  name: string;
  value: number;
}