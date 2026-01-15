import { ROUTES, COMMISSION_RATE, DRIVER_RATE, MOCK_USERS } from '../constants';
import { Trip, User, Route, WeeklySchedule, DailyRoute, ParcelSize } from '../types';

// --- STORAGE HELPERS ---
const STORAGE_KEYS = {
    TRIPS: 'gq_trips_data',
    USERS: 'gq_users_data'
};

const loadFromStorage = <T>(key: string, defaultData: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultData;
    } catch (e) {
        console.error("Storage load error", e);
        return defaultData;
    }
};

const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Storage save error", e);
    }
};

// --- DATA INITIALIZATION ---

// Helper to create default schedule
const createDefaultSchedule = (): WeeklySchedule => ({
  monday: { origin: 'Maputo', destination: 'Xai-Xai', active: true },
  tuesday: { origin: 'Xai-Xai', destination: 'Maputo', active: true },
  wednesday: { origin: 'Maputo', destination: 'Xai-Xai', active: true },
  thursday: { origin: 'Xai-Xai', destination: 'Maputo', active: true },
  friday: { origin: 'Maputo', destination: 'Xai-Xai', active: true },
  saturday: { origin: 'Xai-Xai', destination: 'Maputo', active: true },
  sunday: { origin: 'Maputo', destination: 'Xai-Xai', active: true },
});

// Default Data (if storage is empty)
const DEFAULT_TRIPS: Trip[] = [
  {
    id: 't1',
    routeId: '1', // Maputo - Xai-Xai
    driverId: 'driver1',
    passengerId: 'pass1',
    date: new Date().toISOString(),
    seats: 1,
    type: 'passenger',
    status: 'completed',
    totalPrice: 500,
    commission: 500 * COMMISSION_RATE,
    driverEarnings: 500 * DRIVER_RATE,
    paymentMethod: 'M-Pesa',
    rating: 5,
    feedbackTags: ['Condução Segura']
  }
];

const DEFAULT_USERS: User[] = MOCK_USERS.map(u => ({
    ...u,
    schedule: u.role === 'driver' ? createDefaultSchedule() : undefined,
    specificSchedule: {},
    rating: u.role === 'driver' ? 4.8 : undefined,
    profilePhoto: undefined
})) as User[];

// Initialize State from Storage
let trips: Trip[] = loadFromStorage(STORAGE_KEYS.TRIPS, DEFAULT_TRIPS);
let users: User[] = loadFromStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);

// --- Routes & Pricing ---

export const getRoutes = (): Route[] => {
  return ROUTES;
};

export const getRouteById = (id: string): Route | undefined => {
  return ROUTES.find(r => r.id === id);
};

// --- Trip Management ---

export const createTrip = (
  user: User,
  routeId: string,
  date: string,
  seats: number,
  type: 'passenger' | 'parcel',
  paymentMethod: 'M-Pesa' | 'E-Mola' | 'Cash',
  parcelInfo?: { size: ParcelSize, description: string }
): Trip => {
  const route = getRouteById(routeId);
  if (!route) throw new Error("Invalid Route");

  let price = 0;
  let status: Trip['status'] = 'pending';

  if (type === 'passenger') {
    price = route.price * seats;
    status = 'pending'; // Waiting for payment verification
  } else {
    // Parcels start with 0 price and waiting for quote
    price = 0;
    status = 'waiting_quote';
  }

  const newTrip: Trip = {
    id: Math.random().toString(36).substr(2, 9),
    routeId,
    driverId: null, // Starts as null, Admin must assign
    passengerId: user.id,
    date, // Stored as YYYY-MM-DD usually from input
    seats: type === 'passenger' ? seats : 0,
    type,
    status: status,
    totalPrice: price,
    commission: price * COMMISSION_RATE,
    driverEarnings: price * DRIVER_RATE,
    paymentMethod,
    parcelDetails: type === 'parcel' && parcelInfo ? { size: parcelInfo.size, description: parcelInfo.description } : undefined
  };

  trips.push(newTrip);
  saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
  return newTrip;
};

export const setParcelQuote = (tripId: string, price: number): void => {
    const trip = trips.find(t => t.id === tripId);
    if (trip && trip.type === 'parcel') {
        trip.totalPrice = price;
        trip.commission = price * COMMISSION_RATE;
        trip.driverEarnings = price * DRIVER_RATE;
        trip.status = 'quote_received';
        saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
    }
}

export const acceptParcelQuote = (tripId: string, paymentMethod: 'M-Pesa' | 'E-Mola'): void => {
    const trip = trips.find(t => t.id === tripId);
    if (trip && trip.status === 'quote_received') {
        trip.paymentMethod = paymentMethod;
        trip.status = 'pending';
        saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
    }
}

export const cancelTrip = (tripId: string): void => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
        trip.status = 'cancelled';
        saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
    }
}

export const rescheduleTrip = (tripId: string, newDate: string): void => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
        trip.date = newDate;
        trip.driverId = null;
        trip.status = 'pending';
        saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
    }
}

export const getTripsForUser = (userId: string, role: string): Trip[] => {
  // Always reload from storage to ensure sync across tabs/refreshes if needed
  trips = loadFromStorage(STORAGE_KEYS.TRIPS, trips);
  
  if (role === 'admin') return [...trips]; 
  if (role === 'driver') {
      return trips.filter(t => t.driverId === userId);
  } 
  return trips.filter(t => t.passengerId === userId);
};

export const assignDriver = (tripId: string, driverId: string): void => {
  const trip = trips.find(t => t.id === tripId);
  if (trip) {
    trip.driverId = driverId;
    trip.status = 'confirmed'; 
    saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
  }
};

export const updateTripStatus = (tripId: string, status: Trip['status']): Trip | undefined => {
  const trip = trips.find(t => t.id === tripId);
  if (trip) {
    trip.status = status;
    saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST
    return trip;
  }
  return undefined;
};

export const completeTripWithRating = (tripId: string, rating: number, tags: string[]): Trip | undefined => {
  const trip = trips.find(t => t.id === tripId);
  if (trip) {
    trip.status = 'completed';
    trip.rating = rating;
    trip.feedbackTags = tags;

    // Update Driver Rating Logic
    if (trip.driverId) {
        const driver = users.find(u => u.id === trip.driverId);
        if (driver) {
            const currentRating = driver.rating || 5.0;
            const newRating = ((currentRating * 10) + rating) / 11; 
            driver.rating = parseFloat(newRating.toFixed(1));
            saveToStorage(STORAGE_KEYS.USERS, users); // PERSIST USER RATING
        }
    }

    saveToStorage(STORAGE_KEYS.TRIPS, trips); // PERSIST TRIP
    return trip;
  }
  return undefined;
};

// --- User Management (Admin/Driver) ---

export const getUsers = (): User[] => {
  users = loadFromStorage(STORAGE_KEYS.USERS, users);
  return users;
};

export const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
}

export const registerUser = (user: User): User => {
  const existing = users.find(u => u.email === user.email);
  if (existing) return existing;
  
  if (user.role === 'driver') {
      user.status = 'pending';
      user.schedule = createDefaultSchedule(); 
      user.specificSchedule = {};
      user.rating = 5.0; 
  } else {
      user.status = 'active';
  }
  
  users.push(user);
  saveToStorage(STORAGE_KEYS.USERS, users); // PERSIST
  return user;
};

export const updateUserStatus = (userId: string, status: 'active' | 'suspended'): void => {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = status;
        saveToStorage(STORAGE_KEYS.USERS, users); // PERSIST
    }
};

export const updateDriverSchedule = (userId: string, schedule: WeeklySchedule): void => {
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'driver') {
        user.schedule = schedule;
        saveToStorage(STORAGE_KEYS.USERS, users); // PERSIST
    }
};

export const updateDriverSpecificDate = (userId: string, date: string, route: DailyRoute): void => {
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'driver') {
        if (!user.specificSchedule) user.specificSchedule = {};
        user.specificSchedule[date] = route;
        saveToStorage(STORAGE_KEYS.USERS, users); // PERSIST
    }
};

export const loginUser = (email: string): User | undefined => {
    users = loadFromStorage(STORAGE_KEYS.USERS, users); // Ensure we have latest users
    return users.find(u => u.email === email);
}