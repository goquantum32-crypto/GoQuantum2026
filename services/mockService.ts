import { ROUTES, COMMISSION_RATE, DRIVER_RATE, MOCK_USERS } from '../constants';
import { Trip, User, Route, WeeklySchedule, DailyRoute } from '../types';

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

// In-memory mock databases
let trips: Trip[] = [
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

// Initialize users from constants
let users: User[] = MOCK_USERS.map(u => ({
    ...u,
    schedule: u.role === 'driver' ? createDefaultSchedule() : undefined,
    specificSchedule: {},
    rating: u.role === 'driver' ? 4.8 : undefined, // Default rating for mock drivers
    profilePhoto: undefined // Default empty
})) as User[];

// --- Routes & Pricing ---

export const getRoutes = (): Route[] => {
  return ROUTES;
};

export const getRouteById = (id: string): Route | undefined => {
  return ROUTES.find(r => r.id === id);
};

export const calculateParcelPrice = (routeId: string, weightKg: number): number => {
  const route = getRouteById(routeId);
  if (!route) return 0;
  // Simple logic: Base 20% of ticket price + 50 MZN per kg
  const basePrice = route.price * 0.2;
  const weightCost = weightKg * 50;
  return Math.ceil(basePrice + weightCost);
};

// --- Trip Management ---

export const createTrip = (
  user: User,
  routeId: string,
  date: string,
  seats: number,
  type: 'passenger' | 'parcel',
  paymentMethod: 'M-Pesa' | 'E-Mola' | 'Cash',
  parcelWeight?: number
): Trip => {
  const route = getRouteById(routeId);
  if (!route) throw new Error("Invalid Route");

  let price = 0;
  if (type === 'passenger') {
    price = route.price * seats;
  } else {
    price = calculateParcelPrice(routeId, parcelWeight || 1);
  }

  const newTrip: Trip = {
    id: Math.random().toString(36).substr(2, 9),
    routeId,
    driverId: null, // Starts as null, Admin must assign
    passengerId: user.id,
    date, // Stored as YYYY-MM-DD usually from input
    seats: type === 'passenger' ? seats : 0,
    type,
    status: 'pending',
    totalPrice: price,
    commission: price * COMMISSION_RATE,
    driverEarnings: price * DRIVER_RATE,
    paymentMethod,
    parcelDetails: type === 'parcel' ? { weight: parcelWeight || 1, description: 'Encomenda padrão' } : undefined
  };

  trips.push(newTrip);
  return newTrip;
};

export const getTripsForUser = (userId: string, role: string): Trip[] => {
  if (role === 'admin') return [...trips]; // Return shallow copy to force re-renders if reference changes slightly
  if (role === 'driver') {
      return trips.filter(t => t.driverId === userId);
  } 
  return trips.filter(t => t.passengerId === userId);
};

export const assignDriver = (tripId: string, driverId: string): void => {
  const trip = trips.find(t => t.id === tripId);
  if (trip) {
    trip.driverId = driverId;
    trip.status = 'confirmed'; // Ready for passenger to start
  }
};

export const updateTripStatus = (tripId: string, status: Trip['status']): Trip | undefined => {
  const trip = trips.find(t => t.id === tripId);
  if (trip) {
    trip.status = status;
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

    // Update Driver Rating Logic (Mock calculation)
    if (trip.driverId) {
        const driver = users.find(u => u.id === trip.driverId);
        if (driver) {
            const currentRating = driver.rating || 5.0;
            // Simple moving average simulation
            const newRating = ((currentRating * 10) + rating) / 11; 
            driver.rating = parseFloat(newRating.toFixed(1));
        }
    }

    return trip;
  }
  return undefined;
};

// --- User Management (Admin/Driver) ---

export const getUsers = (): User[] => {
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
      user.schedule = createDefaultSchedule(); // Init schedule
      user.specificSchedule = {};
      user.rating = 5.0; // New driver starts with 5
  } else {
      user.status = 'active';
  }
  
  users.push(user);
  return user;
};

export const updateUserStatus = (userId: string, status: 'active' | 'suspended'): void => {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = status;
    }
};

export const updateDriverSchedule = (userId: string, schedule: WeeklySchedule): void => {
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'driver') {
        user.schedule = schedule;
    }
};

export const updateDriverSpecificDate = (userId: string, date: string, route: DailyRoute): void => {
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'driver') {
        if (!user.specificSchedule) user.specificSchedule = {};
        user.specificSchedule[date] = route;
    }
};

export const loginUser = (email: string): User | undefined => {
    return users.find(u => u.email === email);
}