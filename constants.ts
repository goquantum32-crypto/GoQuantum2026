import { Route } from './types';

export const APP_NAME = "GoQuantum";
export const COMMISSION_RATE = 0.15;
export const DRIVER_RATE = 0.85;

// Base Routes (Maputo -> Destination) - Base Pricing Reference
const BASE_PRICING: Route[] = [
  { id: '1', origin: 'Maputo', destination: 'Xai-Xai', price: 500 },
  { id: '2', origin: 'Maputo', destination: 'Chibuto', price: 500 },
  { id: '3', origin: 'Maputo', destination: 'Manjacaze', price: 600 },
  { id: '4', origin: 'Maputo', destination: 'Chiipadja', price: 700 },
  { id: '5', origin: 'Maputo', destination: 'Banganhane', price: 700 },
  { id: '6', origin: 'Maputo', destination: 'Chicavane', price: 700 },
  { id: '7', origin: 'Maputo', destination: 'Maivene', price: 600 },
  { id: '8', origin: 'Maputo', destination: 'Muhambe', price: 600 },
  { id: '9', origin: 'Maputo', destination: 'Barra do Limpopo', price: 700 },
  { id: '10', origin: 'Maputo', destination: 'V. Pussa', price: 700 },
  { id: '11', origin: 'Maputo', destination: 'Macia', price: 300 },
  { id: '12', origin: 'Maputo', destination: 'Chokwe', price: 500 },
  { id: '13', origin: 'Maputo', destination: 'Chicuacalacuala', price: 1500 },
  { id: '14', origin: 'Maputo', destination: 'Madender', price: 600 },
  { id: '15', origin: 'Maputo', destination: 'Zavala', price: 700 },
  { id: '16', origin: 'Maputo', destination: 'Guambene', price: 950 },
  { id: '17', origin: 'Maputo', destination: 'Inharrime', price: 800 },
  { id: '18', origin: 'Maputo', destination: 'Mudjovote', price: 950 },
  { id: '19', origin: 'Maputo', destination: 'Maxixe', price: 1000 },
  { id: '20', origin: 'Maputo', destination: 'Homoine', price: 1100 },
  { id: '21', origin: 'Maputo', destination: 'Panda', price: 1000 },
  { id: '22', origin: 'Maputo', destination: 'Inhambane-Céu', price: 1000 },
  { id: '23', origin: 'Maputo', destination: 'Massinga', price: 1100 },
  { id: '24', origin: 'Maputo', destination: 'Vilanculos', price: 1500 },
];

// Main stops sequence for logic and dropdowns
export const EN1_STOPS = [
  'Maputo', 
  'Macia', 
  'Xai-Xai', 
  'Chokwe', 
  'Chibuto', 
  'Manjacaze', 
  'Zavala', 
  'Inharrime', 
  'Maxixe', 
  'Homoine', 
  'Panda', 
  'Massinga', 
  'Vilanculos'
];

// Function to generate all possible routes between EN1 stops based on price difference
const generateFullRouteMesh = (): Route[] => {
  const allRoutes: Route[] = [];
  
  // Create a price map relative to Maputo
  const priceMap: Record<string, number> = { 'Maputo': 0 };
  BASE_PRICING.forEach(r => priceMap[r.destination] = r.price);

  // Generate permutations
  EN1_STOPS.forEach(origin => {
    EN1_STOPS.forEach(destination => {
      if (origin === destination) return;

      const priceOrigin = priceMap[origin] !== undefined ? priceMap[origin] : 0;
      const priceDest = priceMap[destination] !== undefined ? priceMap[destination] : 0;
      
      // Calculate price absolute difference
      let price = Math.abs(priceDest - priceOrigin);
      
      // Minimum fare fallback if calc is 0 or too low (e.g., extremely close towns not handled by simple subtraction)
      if (price < 50) price = 100; 

      // If it's a direct Maputo route, ensure we use the exact FEMATRO table price
      if (origin === 'Maputo') {
         const directRoute = BASE_PRICING.find(r => r.destination === destination);
         if (directRoute) price = directRoute.price;
      }
      if (destination === 'Maputo') {
         const directRoute = BASE_PRICING.find(r => r.destination === origin);
         if (directRoute) price = directRoute.price;
      }

      allRoutes.push({
        id: `${origin}_${destination}`.toLowerCase().replace(/\s/g, ''),
        origin,
        destination,
        price
      });
    });
  });

  // Add remaining BASE_PRICING routes that might not be in EN1_STOPS (e.g. smaller towns like Maivene)
  BASE_PRICING.forEach(base => {
     // If this destination wasn't covered in the loop above (because it's not in EN1_STOPS)
     if (!EN1_STOPS.includes(base.destination)) {
         allRoutes.push(base); // Maputo -> SmallTown
         allRoutes.push({ // SmallTown -> Maputo
             id: `ret_${base.id}`,
             origin: base.destination,
             destination: 'Maputo',
             price: base.price
         });
     }
  });

  return allRoutes;
};

export const ROUTES: Route[] = generateFullRouteMesh();

export const MOCK_USERS = [
  { id: 'admin1', name: 'Administrador GoQuantum', email: 'goquantum32@gmail.com', phone: '840000000', role: 'admin', status: 'active' },
  { id: 'driver1', name: 'João Condutor', email: 'joao@driver.mz', phone: '841111111', role: 'driver', vehiclePlate: 'ABC-123-MC', status: 'active', licensePhoto: 'carta_joao.jpg', currentLocation: 'Maputo' },
  { id: 'driver2', name: 'Pedro Pendente', email: 'pedro@driver.mz', phone: '843333333', role: 'driver', vehiclePlate: 'PEND-001', status: 'pending', licensePhoto: 'carta_nova.jpg' },
  { id: 'pass1', name: 'Maria Viajante', email: 'maria@client.mz', phone: '842222222', role: 'passenger', idNumber: '11001100N', status: 'active' },
];

// Colors for UI consistency
export const THEME = {
  primary: 'bg-yellow-400',
  secondary: 'bg-green-600',
  accent: 'bg-red-600',
  dark: 'bg-slate-900',
  card: 'bg-slate-800',
};