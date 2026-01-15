import React, { useMemo, useState } from 'react';
import { getTripsForUser, getRoutes, getUsers, updateUserStatus, assignDriver, setParcelQuote } from '../services/mockService';
import { User, Trip, WeeklySchedule } from '../types';
import { EN1_STOPS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, CheckCircle, XCircle, FileText, Truck, LayoutDashboard, Database, UserCheck, Shield, CreditCard, ArrowUpDown, Filter, Map, Calendar, Phone, Clock, AlertTriangle, MessageSquare } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'trips' | 'payments'>('dashboard');
  const [refresh, setRefresh] = useState(0);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null); // For assigning driver modal
  const [quoteTripId, setQuoteTripId] = useState<string | null>(null); // For parcel quote modal
  const [quotePrice, setQuotePrice] = useState(0);

  // Payment Filters & Sorting
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'M-Pesa' | 'E-Mola'>('all');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const trips = useMemo(() => getTripsForUser(user.id, 'admin'), [user.id, refresh]);
  const routes = useMemo(() => getRoutes(), []);
  const allUsers = useMemo(() => getUsers(), [refresh]);
  const drivers = allUsers.filter(u => u.role === 'driver');

  // Actions
  const handleApproveDriver = (id: string) => {
    updateUserStatus(id, 'active');
    setRefresh(prev => prev + 1);
  };

  const handleSuspendDriver = (id: string) => {
    updateUserStatus(id, 'suspended');
    setRefresh(prev => prev + 1);
  };

  const handleAssignDriver = (driverId: string) => {
      if (selectedTripId) {
          assignDriver(selectedTripId, driverId);
          setSelectedTripId(null);
          setRefresh(prev => prev + 1);
      }
  };

  const handleSetQuote = () => {
      if (quoteTripId && quotePrice > 0) {
          setParcelQuote(quoteTripId, quotePrice);
          setQuoteTripId(null);
          setQuotePrice(0);
          setRefresh(prev => prev + 1);
      }
  };

  // Stats
  const totalRevenue = trips.filter(t => t.status !== 'pending' && t.status !== 'cancelled' && t.status !== 'waiting_quote').reduce((acc, t) => acc + t.totalPrice, 0);
  const companyCommission = trips.filter(t => t.status !== 'pending' && t.status !== 'cancelled' && t.status !== 'waiting_quote').reduce((acc, t) => acc + t.commission, 0);
  const driverPayouts = trips.filter(t => t.status !== 'pending' && t.status !== 'cancelled' && t.status !== 'waiting_quote').reduce((acc, t) => acc + t.driverEarnings, 0);

  // Helper: Logic to check if a driver's full path covers the passenger's path
  const isDriverRouteCompatible = (driverOrigin: string, driverDest: string, passOrigin: string, passDest: string) => {
      // Get Indices from the master EN1 list
      const dStartIndex = EN1_STOPS.indexOf(driverOrigin);
      const dEndIndex = EN1_STOPS.indexOf(driverDest);
      const pStartIndex = EN1_STOPS.indexOf(passOrigin);
      const pEndIndex = EN1_STOPS.indexOf(passDest);

      // If any location is not in our ordered list, fallback to Exact Match of Origin AND Destination
      if (dStartIndex === -1 || dEndIndex === -1 || pStartIndex === -1 || pEndIndex === -1) {
          return driverOrigin === passOrigin && driverDest === passDest;
      }

      // Check Direction
      const driverGoingNorth = dEndIndex > dStartIndex;
      const passengerGoingNorth = pEndIndex > pStartIndex;

      // Must be going in the same direction
      if (driverGoingNorth !== passengerGoingNorth) return false;

      if (driverGoingNorth) {
          // Northbound (e.g., Maputo -> Vilanculos)
          // Driver must start BEFORE or AT Passenger Start
          // Driver must end AFTER or AT Passenger End
          return dStartIndex <= pStartIndex && dEndIndex >= pEndIndex;
      } else {
          // Southbound (e.g., Vilanculos -> Maputo)
          // Driver Start Index (e.g. 12) must be >= Passenger Start Index (e.g. 11 or 12)
          // Driver End Index (e.g. 0) must be <= Passenger End Index (e.g. 2 or 0)
          return dStartIndex >= pStartIndex && dEndIndex <= pEndIndex;
      }
  };

  // Helper: Get available drivers for a specific trip
  const getAvailableDriversForTrip = (trip: Trip) => {
      const tripDateObj = new Date(trip.date);
      const dateStr = trip.date.split('T')[0]; // YYYY-MM-DD
      const dayIndex = tripDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const days: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = days[dayIndex];
      const route = routes.find(r => r.id === trip.routeId);

      if(!route) return [];

      return drivers.filter(d => {
          if (d.status !== 'active') return false;
          
          let scheduleForDay;
          
          // 1. Check Specific Date Schedule Priority
          if (d.specificSchedule && d.specificSchedule[dateStr]) {
             scheduleForDay = d.specificSchedule[dateStr];
          } 
          // 2. Fallback to Weekly Schedule
          else if (d.schedule) {
             scheduleForDay = d.schedule[dayKey];
          }

          if (!scheduleForDay || !scheduleForDay.active) return false;
          
          // Use the enhanced compatibility check
          return isDriverRouteCompatible(
              scheduleForDay.origin, 
              scheduleForDay.destination, 
              route.origin, 
              route.destination
          );
      });
  };


  // Chart Data preparation
  const chartData = routes
    .filter(r => r.origin === 'Maputo') // Only show main routes in chart to avoid clutter
    .map(route => {
    const routeTrips = trips.filter(t => t.routeId === route.id && t.status !== 'pending');
    return {
      name: route.destination,
      Viagens: routeTrips.length,
      Faturamento: routeTrips.reduce((acc, t) => acc + t.totalPrice, 0)
    };
  }).filter(d => d.Viagens > 0);

  // Payments Logic
  const filteredPayments = useMemo(() => {
    let result = trips.filter(t => t.status !== 'cancelled' && t.status !== 'waiting_quote'); 
    
    // Filter
    if (paymentFilter !== 'all') {
        result = result.filter(t => t.paymentMethod === paymentFilter);
    }

    // Sort
    return result.sort((a, b) => {
        if (sortOrder === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortOrder === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortOrder === 'amount_desc') return b.totalPrice - a.totalPrice;
        if (sortOrder === 'amount_asc') return a.totalPrice - b.totalPrice;
        return 0;
    });
  }, [trips, paymentFilter, sortOrder]);


  const renderDashboard = () => (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-sm font-medium uppercase mb-2">Receita (Confirmada)</p>
            <h3 className="text-3xl font-black text-white">{totalRevenue.toLocaleString()} MT</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-sm font-medium uppercase mb-2">Comissão GoQuantum (15%)</p>
            <h3 className="text-3xl font-black text-yellow-400">{Math.floor(companyCommission).toLocaleString()} MT</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-sm font-medium uppercase mb-2">Pago aos Motoristas (85%)</p>
            <h3 className="text-3xl font-black text-green-500">{Math.floor(driverPayouts).toLocaleString()} MT</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h3 className="text-white font-bold mb-6">Viagens por Rota (Partida Maputo)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="Viagens" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h3 className="text-white font-bold mb-6">Faturamento por Rota (Partida Maputo)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            formatter={(value: number) => `${value} MT`}
                        />
                        <Bar dataKey="Faturamento" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </>
  );

  const renderDrivers = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
            <h3 className="text-white font-bold text-xl">Gestão de Motoristas</h3>
            <p className="text-slate-400 text-sm">Aprove novos registos e verifique documentos.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-6 py-3">Nome</th>
                        <th className="px-6 py-3">Contacto</th>
                        <th className="px-6 py-3">Matrícula</th>
                        <th className="px-6 py-3">Carta</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {drivers.map(driver => (
                        <tr key={driver.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="px-6 py-4 font-bold text-white">{driver.name}</td>
                            <td className="px-6 py-4">{driver.phone}</td>
                            <td className="px-6 py-4 uppercase font-mono">{driver.vehiclePlate}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-blue-400 cursor-pointer hover:underline">
                                    <FileText size={16} />
                                    <span>{driver.licensePhoto || 'Sem foto'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    driver.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                    driver.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-red-500/20 text-red-500'
                                }`}>
                                    {driver.status === 'active' ? 'Ativo' : driver.status === 'pending' ? 'Pendente' : 'Suspenso'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {driver.status === 'pending' && (
                                    <button 
                                        onClick={() => handleApproveDriver(driver.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors mr-2"
                                    >
                                        Aprovar
                                    </button>
                                )}
                                {driver.status === 'active' && (
                                    <button 
                                        onClick={() => handleSuspendDriver(driver.id)}
                                        className="bg-red-600/20 hover:bg-red-600 hover:text-white text-red-400 border border-red-600/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Suspender
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderTrips = () => (
     <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
            <h3 className="text-white font-bold text-xl">Gestão de Viagens</h3>
            <p className="text-slate-400 text-sm">Visualize e atribua motoristas para viagens pendentes.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Rota</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3">Passageiro</th>
                        <th className="px-6 py-3">Motorista</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.slice().reverse().map(trip => {
                        const route = routes.find(r => r.id === trip.routeId);
                        const passenger = allUsers.find(u => u.id === trip.passengerId);
                        const driver = allUsers.find(u => u.id === trip.driverId);
                        
                        return (
                            <tr key={trip.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="px-6 py-4">{new Date(trip.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{route?.origin} ➔ {route?.destination}</td>
                                <td className="px-6 py-4 capitalize">
                                    {trip.type}
                                    {trip.type === 'parcel' && (
                                        <span className="block text-[10px] text-slate-500">{trip.parcelDetails?.size} - {trip.parcelDetails?.description}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{passenger?.name || trip.passengerId}</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Phone size={10} /> {passenger?.phone || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {driver ? (
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold">{driver.name}</span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Phone size={10} /> {driver.phone}
                                            </span>
                                        </div>
                                    ) : '---'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        trip.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                        (trip.status === 'confirmed' || trip.status === 'in-progress') ? 'bg-blue-500/20 text-blue-500' :
                                        trip.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                        trip.status === 'waiting_quote' ? 'bg-purple-500/20 text-purple-500' :
                                        'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                        {trip.status === 'pending' ? 'Pendente' : 
                                         trip.status === 'waiting_quote' ? 'Nova Cotação' :
                                         trip.status === 'quote_received' ? 'Aguardando Pagamento' :
                                         trip.status === 'confirmed' ? 'Confirmada' : 
                                         trip.status === 'in-progress' ? 'Em curso' : 
                                         trip.status === 'cancelled' ? 'Cancelada' : 'Concluída'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {trip.status === 'waiting_quote' && (
                                        <button 
                                            onClick={() => { setQuoteTripId(trip.id); setQuotePrice(0); }}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1 ml-auto"
                                        >
                                            <MessageSquare size={12} /> Definir Preço
                                        </button>
                                    )}
                                    {trip.status === 'pending' && (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-yellow-500 font-bold mb-1">Verificar Pagamento!</span>
                                            <button 
                                                onClick={() => setSelectedTripId(trip.id)}
                                                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg"
                                            >
                                                Confirmar e Atribuir
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderPayments = () => (
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* ... (Existing payment code) ... */}
        <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="text-white font-bold text-xl">Histórico de Pagamentos</h3>
                <p className="text-slate-400 text-sm">Registo financeiro detalhado e auditável.</p>
            </div>
            
            <div className="flex gap-4">
                {/* Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <select 
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-600 text-slate-300 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                        <option value="all">Todos os Métodos</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="E-Mola">E-Mola</option>
                    </select>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-6 py-3">ID Transação</th>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Passageiro</th>
                        <th className="px-6 py-3">Método</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPayments.map(trip => {
                            const passenger = allUsers.find(u => u.id === trip.passengerId);
                            const isPending = trip.status === 'pending';

                            return (
                                <tr key={trip.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{trip.id.toUpperCase()}</td>
                                    <td className="px-6 py-4">{new Date(trip.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        {passenger?.name || trip.passengerId}
                                        <span className="block text-xs text-slate-500">{passenger?.phone}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                            trip.paymentMethod === 'M-Pesa' 
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        }`}>
                                            {trip.paymentMethod || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isPending ? (
                                             <div className="flex items-center gap-1 text-yellow-500 animate-pulse">
                                                <Clock size={14} />
                                                <span className="font-bold">Aguardando Confirmação</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-green-400">
                                                <CheckCircle size={14} />
                                                <span>Pago</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white">{trip.totalPrice} MT</td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </div>
      </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <Download size={16} /> Exportar Relatório
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
        <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
            <LayoutDashboard size={18} />
            Visão Geral
        </button>
        <button 
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drivers' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
            <UserCheck size={18} />
            Motoristas
        </button>
        <button 
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'trips' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
            <Database size={18} />
            Viagens / Despacho
        </button>
        <button 
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
            <CreditCard size={18} />
            Pagamentos
        </button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'drivers' && renderDrivers()}
      {activeTab === 'trips' && renderTrips()}
      {activeTab === 'payments' && renderPayments()}
      
      {/* Quote Modal */}
      {quoteTripId && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700 my-auto">
                  <h3 className="text-xl font-bold text-white mb-2">Definir Preço da Encomenda</h3>
                  <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-4 flex items-start gap-2">
                       <Phone className="text-blue-400 shrink-0 mt-0.5" size={16} />
                       <p className="text-xs text-blue-200">
                           <strong>Passo 1:</strong> Ligue para um motorista disponível para negociar o valor do transporte da carga.
                       </p>
                  </div>
                  
                  {(() => {
                      const trip = trips.find(t => t.id === quoteTripId);
                      if (!trip) return null;
                      
                      // Get compatible drivers for this parcel route
                      const availableDrivers = getAvailableDriversForTrip(trip);

                      return (
                        <>
                            <div className="bg-slate-900 p-3 rounded mb-4 text-sm text-slate-300">
                                <p><strong>Item:</strong> {trip.parcelDetails?.description}</p>
                                <p><strong>Tamanho:</strong> {trip.parcelDetails?.size}</p>
                                <p><strong>Rota:</strong> {routes.find(r => r.id === trip.routeId)?.origin} - {routes.find(r => r.id === trip.routeId)?.destination}</p>
                            </div>

                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Motoristas Disponíveis para Negociação:</p>
                            <div className="max-h-40 overflow-y-auto mb-6 space-y-2 pr-1">
                                {availableDrivers.length === 0 ? (
                                    <p className="text-xs text-red-400 italic">Nenhum motorista com escala compatível nesta data.</p>
                                ) : (
                                    availableDrivers.map(d => (
                                        <div key={d.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded border border-slate-600">
                                            <div>
                                                <p className="text-white text-sm font-bold">{d.name}</p>
                                                <p className="text-xs text-slate-400">{d.vehiclePlate}</p>
                                            </div>
                                            <a href={`tel:${d.phone}`} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1.5 rounded transition-colors">
                                                <Phone size={12} /> {d.phone}
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="border-t border-slate-700 pt-4">
                                <p className="text-xs text-blue-200 mb-2">
                                    <strong>Passo 2:</strong> Insira o valor acordado + comissão para o cliente.
                                </p>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Preço Final ao Cliente (MT)</label>
                                <input 
                                    type="number" 
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Ex: 500"
                                />

                                <div className="flex gap-3">
                                    <button onClick={() => setQuoteTripId(null)} className="flex-1 py-3 text-slate-400 hover:text-white text-sm">Cancelar</button>
                                    <button onClick={handleSetQuote} disabled={quotePrice <= 0} className="flex-1 bg-purple-600 text-white font-bold rounded-lg py-3 hover:bg-purple-700 disabled:opacity-50 text-sm">
                                        Enviar Cotação
                                    </button>
                                </div>
                            </div>
                        </>
                      );
                  })()}
              </div>
          </div>
      )}

      {/* Driver Assignment Modal */}
      {selectedTripId && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Atribuir Motorista</h3>
                  <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 mb-4 flex items-start gap-2">
                       <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                       <p className="text-sm text-yellow-200">
                           <strong>Atenção Admin:</strong> Verifique se recebeu o valor via M-Pesa/E-Mola antes de atribuir o motorista. Ao atribuir, a viagem será confirmada.
                       </p>
                  </div>
                  <p className="text-slate-400 mb-4 text-sm">A mostrar motoristas com escala compatível para a data da viagem.</p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                      {(() => {
                          const trip = trips.find(t => t.id === selectedTripId);
                          if (!trip) return null;
                          const candidates = getAvailableDriversForTrip(trip);

                          if (candidates.length === 0) {
                              return <p className="text-red-400 text-center py-4">Nenhum motorista disponível na escala para esta rota nesta data.</p>;
                          }

                          return candidates.map(driver => (
                              <div key={driver.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg border border-slate-600">
                                  <div>
                                      <p className="text-white font-bold">{driver.name}</p>
                                      <p className="text-xs text-slate-400 flex items-center gap-1">
                                          <Phone size={12} className="text-green-400" />
                                          <span className="text-green-400 font-bold">{driver.phone}</span>
                                          <span className="text-slate-600 mx-1">|</span>
                                          <span className="uppercase">{driver.vehiclePlate}</span>
                                      </p>
                                      <p className="text-xs mt-1">
                                          {/* Show specific route info if available for that day, otherwise generic */}
                                          {driver.specificSchedule?.[trip.date.split('T')[0]] ? (
                                              <span className="text-green-400">Escala Específica: {driver.specificSchedule[trip.date.split('T')[0]].destination}</span>
                                          ) : (
                                              <span className="text-yellow-400">Escala Padrão</span>
                                          )}
                                      </p>
                                  </div>
                                  <button 
                                      onClick={() => handleAssignDriver(driver.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded"
                                  >
                                      Confirmar
                                  </button>
                              </div>
                          ));
                      })()}
                  </div>

                  <button 
                    onClick={() => setSelectedTripId(null)}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-lg"
                  >
                      Cancelar
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};