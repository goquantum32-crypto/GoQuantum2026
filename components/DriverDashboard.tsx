import React, { useMemo, useState } from 'react';
import { User, WeeklySchedule, DailyRoute } from '../types';
import { getTripsForUser, getRoutes, getUsers, updateDriverSpecificDate } from '../services/mockService';
import { CheckCircle, Map, DollarSign, User as UserIcon, Package, Calendar, ChevronLeft, ChevronRight, Save, Phone } from 'lucide-react';

interface DriverDashboardProps {
  user: User;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'trips' | 'schedule'>('schedule');
  const [refresh, setRefresh] = useState(0);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Local state for the selected day's route configuration (before saving)
  const [dayConfig, setDayConfig] = useState<DailyRoute>({ origin: 'Maputo', destination: 'Xai-Xai', active: true });

  // IMPORTANT: Depend on 'refresh' to reload users from storage
  const allUsers = useMemo(() => getUsers(), [refresh]);
  
  // IMPORTANT: Use the fresh user data from storage, fallback to prop user if not found
  const currentUser = allUsers.find(u => u.id === user.id) || user;

  const trips = useMemo(() => getTripsForUser(user.id, 'driver'), [user.id, refresh]);
  const routes = useMemo(() => getRoutes(), []);
  
  const availableOrigins = useMemo(() => [...new Set(routes.map(r => r.origin))].sort(), [routes]);
  const availableDestinations = useMemo(() => [...new Set(routes.map(r => r.destination))].sort(), [routes]);

  const assignedTrips = trips.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTrips = trips.filter(t => t.status === 'completed');
  const totalEarnings = completedTrips.reduce((acc, t) => acc + t.driverEarnings, 0);

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaySchedule = (year: number, month: number, day: number): DailyRoute | null => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 1. Check Specific Date (Using currentUser to see updates immediately)
      if (currentUser.specificSchedule && currentUser.specificSchedule[dateStr]) {
          return currentUser.specificSchedule[dateStr];
      }
      
      // 2. Fallback to Weekly Template (Using currentUser)
      const dayOfWeek = new Date(year, month, day).getDay();
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      if (currentUser.schedule) {
          return currentUser.schedule[dayMap[dayOfWeek] as keyof WeeklySchedule];
      }
      
      return null;
  };

  const handleDayClick = (day: number) => {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDateStr(dateStr);
      
      // Load existing config for this day or default
      const existing = getDaySchedule(currentDate.getFullYear(), currentDate.getMonth(), day);
      if (existing) {
          setDayConfig({ ...existing });
      } else {
          setDayConfig({ origin: 'Maputo', destination: 'Vilanculos', active: true });
      }
  };

  const handleSaveDayConfig = () => {
      if (selectedDateStr) {
          updateDriverSpecificDate(currentUser.id, selectedDateStr, dayConfig);
          setSelectedDateStr(null);
          setRefresh(prev => prev + 1); // Force re-render of calendar and re-fetch of users
      }
  };


  const TripCard = ({ trip }: { trip: any }) => {
    const r = routes.find(ro => ro.id === trip.routeId);
    const passenger = allUsers.find(u => u.id === trip.passengerId);

    return (
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-4 shadow-sm relative overflow-hidden">
        {trip.status === 'confirmed' && <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-1">AGUARDAR PASSAGEIRO</div>}
        {trip.status === 'in-progress' && <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 animate-pulse">EM VIAGEM</div>}
        
        <div className="flex justify-between items-start mb-3 mt-2">
           <div>
             <h3 className="text-white font-bold text-lg flex items-center gap-2">
                {trip.type === 'passenger' ? <UserIcon size={18} className="text-yellow-400"/> : <Package size={18} className="text-green-500"/>}
                {r?.origin} ➔ {r?.destination}
             </h3>
             <p className="text-slate-400 text-sm mt-1">{new Date(trip.date).toLocaleDateString()}</p>
           </div>
           <div className="text-right mt-4">
              <span className="block text-xl font-bold text-green-400">+{Math.floor(trip.driverEarnings)} MT</span>
              <span className="text-xs text-slate-500">Comissão 85%</span>
           </div>
        </div>

        {/* Passenger Info Section */}
        {passenger && (
            <div className="mb-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Passageiro</p>
                <p className="text-white font-bold">{passenger.name}</p>
                <div className="flex items-center gap-2 text-yellow-400 mt-1 cursor-pointer">
                     <Phone size={14} />
                     <span className="text-sm font-bold">{passenger.phone}</span>
                </div>
            </div>
        )}

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-2 bg-slate-900/50 p-3 rounded-lg">
             <div>
                <span className="text-slate-500 block text-xs uppercase">Detalhes da Carga/Lugares</span>
                {trip.type === 'passenger' ? `${trip.seats} Lugares Reservados` : `${trip.parcelDetails?.weight || '---'}kg Encomenda`}
             </div>
        </div>
        
        <p className="text-xs text-slate-500 text-center italic">
            {trip.status === 'confirmed' ? 'Aguarde o passageiro iniciar a viagem.' : 'Viagem em curso. O passageiro confirmará a chegada.'}
        </p>
      </div>
    );
  };

  const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const numDays = daysInMonth(year, month);
      const startDay = firstDayOfMonth(year, month);
      
      const days = [];
      // Empty slots for start of month
      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-24 bg-slate-800/50 border border-slate-700/50"></div>);
      }
      
      // Actual days
      for (let day = 1; day <= numDays; day++) {
          const schedule = getDaySchedule(year, month, day);
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDateStr === dateStr;
          
          days.push(
              <div 
                  key={day} 
                  onClick={() => handleDayClick(day)}
                  className={`h-24 border border-slate-700 p-1 relative cursor-pointer hover:bg-slate-700 transition-colors ${isSelected ? 'ring-2 ring-yellow-400 bg-slate-700' : 'bg-slate-800'}`}
              >
                  <span className="text-slate-400 font-bold text-sm block">{day}</span>
                  {schedule && schedule.active ? (
                      <div className="mt-1 text-[10px] leading-tight">
                          <span className="block text-green-400 font-bold">DISPONÍVEL</span>
                          <span className="text-white">{schedule.origin}</span>
                          <span className="text-slate-400 mx-0.5">➔</span>
                          <span className="text-white">{schedule.destination}</span>
                      </div>
                  ) : (
                      <div className="mt-2 text-center">
                          <span className="text-[10px] text-red-500/50 font-bold">OFF</span>
                      </div>
                  )}
              </div>
          );
      }

      return (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
                  <button onClick={handlePrevMonth} className="p-1 hover:text-yellow-400 text-slate-300"><ChevronLeft /></button>
                  <span className="text-white font-bold text-lg capitalize">
                      {currentDate.toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1 hover:text-yellow-400 text-slate-300"><ChevronRight /></button>
              </div>
              <div className="grid grid-cols-7 text-center bg-slate-900 text-xs font-bold text-slate-400 py-2 border-b border-slate-700 uppercase">
                  <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
              </div>
              <div className="grid grid-cols-7">
                  {days}
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      
      {/* Earnings Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Meus Ganhos</p>
                <h2 className="text-4xl font-black text-white">{Math.floor(totalEarnings)} <span className="text-lg font-normal text-yellow-400">MZN</span></h2>
            </div>
            <div className="bg-yellow-400/20 p-3 rounded-full text-yellow-400">
                <DollarSign size={32} />
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-4 text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'schedule' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400'
          }`}
        >
          <Calendar size={18} /> Meu Calendário
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`pb-3 px-4 text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'trips' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400'
          }`}
        >
          <Map size={18} /> Viagens Atribuídas
           {assignedTrips.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{assignedTrips.length}</span>}
        </button>
      </div>

      {activeTab === 'schedule' && (
          <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-bold text-xl">Disponibilidade Mensal</h3>
                  <p className="text-xs text-slate-400">Selecione um dia para editar a rota.</p>
              </div>

              {renderCalendar()}

              {/* Edit Modal / Drawer for selected Day */}
              {selectedDateStr && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                      <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 border border-slate-700 animate-in slide-in-from-bottom-10">
                          <h4 className="text-white font-bold text-lg mb-4">
                              Editar: {new Date(selectedDateStr).toLocaleDateString()}
                          </h4>
                          
                          <div className="space-y-4 mb-6">
                              <div className="flex items-center gap-2 mb-2">
                                  <label className="text-slate-300 text-sm">Estado:</label>
                                  <button 
                                      onClick={() => setDayConfig(prev => ({...prev, active: !prev.active}))}
                                      className={`px-3 py-1 rounded text-xs font-bold ${dayConfig.active ? 'bg-green-500 text-slate-900' : 'bg-red-500 text-white'}`}
                                  >
                                      {dayConfig.active ? 'Disponível' : 'Indisponível'}
                                  </button>
                              </div>

                              {dayConfig.active && (
                                  <>
                                      <div>
                                          <label className="block text-xs font-medium text-slate-400 mb-1">Origem</label>
                                          <select 
                                              value={dayConfig.origin}
                                              onChange={(e) => setDayConfig(prev => ({...prev, origin: e.target.value}))}
                                              className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-600 outline-none focus:border-yellow-400"
                                          >
                                              {availableOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-medium text-slate-400 mb-1">Destino</label>
                                          <select 
                                              value={dayConfig.destination}
                                              onChange={(e) => setDayConfig(prev => ({...prev, destination: e.target.value}))}
                                              className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-600 outline-none focus:border-yellow-400"
                                          >
                                              {availableDestinations.map(d => <option key={d} value={d}>{d}</option>)}
                                          </select>
                                      </div>
                                  </>
                              )}
                          </div>

                          <div className="flex gap-3">
                              <button onClick={() => setSelectedDateStr(null)} className="flex-1 py-3 text-slate-400 hover:text-white">Cancelar</button>
                              <button onClick={handleSaveDayConfig} className="flex-1 bg-yellow-400 text-slate-900 font-bold rounded-lg py-3 flex justify-center items-center gap-2">
                                  <Save size={18} /> Salvar
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'trips' && (
          <div className="space-y-6">
              {assignedTrips.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                          <CheckCircle size={32} />
                      </div>
                      <p className="text-slate-400">Não tens viagens atribuídas no momento.</p>
                      <p className="text-slate-500 text-sm">O administrador irá alocar viagens baseadas na tua escala.</p>
                  </div>
              ) : (
                  assignedTrips.map(t => <TripCard key={t.id} trip={t} />)
              )}
          </div>
      )}
    </div>
  );
};