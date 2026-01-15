import React, { useState, useMemo } from 'react';
import { User, Trip, ParcelSize } from '../types';
import { getRoutes, createTrip, getTripsForUser, updateTripStatus, completeTripWithRating, cancelTrip, rescheduleTrip, acceptParcelQuote, getUsers } from '../services/mockService';
import { Bus, Package, Calendar, MapPin, CreditCard, CheckCircle, Clock, Navigation, Play, Flag, AlertTriangle, Star, ThumbsUp, ThumbsDown, Phone, XCircle, RotateCw } from 'lucide-react';

interface PassengerViewProps {
  user: User;
}

export const PassengerView: React.FC<PassengerViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');
  const [bookingType, setBookingType] = useState<'passenger' | 'parcel'>('passenger');
  
  // Form State
  const [origin, setOrigin] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(1);
  
  // Parcel Form State
  const [parcelSize, setParcelSize] = useState<ParcelSize>('Pequeno');
  const [parcelDesc, setParcelDesc] = useState('');
  
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'E-Mola'>('M-Pesa');
  
  // Reschedule Modal
  const [rescheduleTripId, setRescheduleTripId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTripId, setRatingTripId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Used to force re-render when data changes
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // UX State for confirmations
  const [confirmActionId, setConfirmActionId] = useState<string | null>(null);

  const routes = useMemo(() => getRoutes(), []);
  const history = useMemo(() => getTripsForUser(user.id, 'passenger'), [user.id, refreshTrigger]);
  const allUsers = useMemo(() => getUsers(), [refreshTrigger]); // Needed to find driver details

  // Derived data
  const availableOrigins = useMemo(() => [...new Set(routes.map(r => r.origin))].sort(), [routes]);
  const availableDestinations = useMemo(() => {
    return routes.filter(r => r.origin === origin);
  }, [routes, origin]);

  const selectedRoute = routes.find(r => r.id === selectedRouteId);
  const price = selectedRoute 
    ? (bookingType === 'passenger' ? selectedRoute.price * seats : 0) // Parcel price starts at 0
    : 0;

  const handleBook = () => {
    if (!selectedRouteId || !date) return;
    
    if (bookingType === 'parcel') {
        // Parcels skip payment screen initially, goes to quote
        setIsProcessing(true);
        setTimeout(() => {
            createTrip(user, selectedRouteId, date, 0, 'parcel', paymentMethod, { size: parcelSize, description: parcelDesc });
            setIsProcessing(false);
            setRefreshTrigger(prev => prev + 1);
            setActiveTab('history');
            // Reset form
            setSelectedRouteId('');
            setDate('');
            setOrigin('');
            setParcelDesc('');
        }, 1000);
    } else {
        // Passengers go to payment
        setShowPayment(true);
    }
  };

  const confirmPayment = () => {
    setIsProcessing(true);
    // Simulate network delay for creating the request
    setTimeout(() => {
        createTrip(user, selectedRouteId, date, seats, bookingType, paymentMethod);
        setIsProcessing(false);
        setShowPayment(false);
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('history');
        // Reset form
        setSelectedRouteId('');
        setDate('');
        setOrigin('');
    }, 1500);
  };

  const handleAcceptQuote = (tripId: string) => {
      // In a real app, this would open payment modal. 
      // For mock, we'll assume they select M-Pesa immediately and confirm.
      acceptParcelQuote(tripId, 'M-Pesa');
      setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelTrip = (tripId: string) => {
      if (window.confirm("Tem certeza que deseja cancelar esta viagem/encomenda? O motorista será notificado.")) {
          cancelTrip(tripId);
          setRefreshTrigger(prev => prev + 1);
      }
  };

  const handleReschedule = () => {
      if (rescheduleTripId && newDate) {
          rescheduleTrip(rescheduleTripId, newDate);
          setRescheduleTripId(null);
          setNewDate('');
          setRefreshTrigger(prev => prev + 1);
      }
  };

  const handleStartTrip = (tripId: string) => {
      updateTripStatus(tripId, 'in-progress');
      setConfirmActionId(null);
      setRefreshTrigger(prev => prev + 1);
  };

  const handleEndTrip = (tripId: string) => {
      setRatingTripId(tripId);
      setRating(5);
      setSelectedTags([]);
      setShowRatingModal(true);
      setConfirmActionId(null);
  };

  const submitRating = () => {
      if (ratingTripId) {
          completeTripWithRating(ratingTripId, rating, selectedTags);
          setShowRatingModal(false);
          setRatingTripId(null);
          setRefreshTrigger(prev => prev + 1);
      }
  };

  const toggleTag = (tag: string) => {
      if (selectedTags.includes(tag)) {
          setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
          setSelectedTags([...selectedTags, tag]);
      }
  };

  const FEEDBACK_TAGS = [
      "Condução Segura",
      "Carro Limpo",
      "Simpático",
      "Chegou a Tempo",
      "Ar Condicionado",
      "Boa Música"
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase">Viagens</p>
          <p className="text-2xl font-bold text-white">{history.filter(t => t.type === 'passenger').length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase">Encomendas</p>
          <p className="text-2xl font-bold text-white">{history.filter(t => t.type === 'parcel').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('book')}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'book' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400'
          }`}
        >
          Nova Reserva
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'history' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400'
          }`}
        >
          Histórico
        </button>
      </div>

      {activeTab === 'book' ? (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setBookingType('passenger')}
              className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${
                bookingType === 'passenger' 
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' 
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Bus className="w-6 h-6" />
              <span className="font-semibold">Viagem</span>
            </button>
            <button
              onClick={() => setBookingType('parcel')}
              className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${
                bookingType === 'parcel' 
                  ? 'border-green-500 bg-green-500/10 text-green-500' 
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Package className="w-6 h-6" />
              <span className="font-semibold">Encomenda</span>
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Origin Selector */}
            <div>
              <label className="block text-slate-400 text-sm mb-2 font-medium">Origem</label>
              <div className="relative">
                <Navigation className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <select
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setSelectedRouteId(''); // Reset destination when origin changes
                  }}
                  className="w-full bg-slate-900 text-white pl-12 pr-4 py-3 rounded-xl border border-slate-700 focus:border-yellow-400 focus:outline-none appearance-none"
                >
                  <option value="">Selecione a origem...</option>
                  {availableOrigins.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Selector */}
            <div>
              <label className="block text-slate-400 text-sm mb-2 font-medium">Destino</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  disabled={!origin}
                  className="w-full bg-slate-900 text-white pl-12 pr-4 py-3 rounded-xl border border-slate-700 focus:border-yellow-400 focus:outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{origin ? 'Selecione o destino...' : 'Selecione a origem primeiro'}</option>
                  {availableDestinations.map(route => (
                    <option key={route.id} value={route.id}>{route.destination} {bookingType === 'passenger' && `- ${route.price} MZN`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2 font-medium">Data</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 text-white pl-12 pr-4 py-3 rounded-xl border border-slate-700 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {bookingType === 'passenger' ? (
               <div>
                 <label className="block text-slate-400 text-sm mb-2 font-medium">Número de Lugares</label>
                 <input
                   type="number"
                   min="1"
                   max="15"
                   value={seats}
                   onChange={(e) => setSeats(Number(e.target.value))}
                   className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-yellow-400 focus:outline-none"
                 />
                 <div className="bg-slate-900 p-4 rounded-xl mt-6 flex justify-between items-center border border-slate-700">
                    <span className="text-slate-400">Total a Pagar</span>
                    <span className="text-2xl font-bold text-white">{Math.floor(price)} MZN</span>
                 </div>
               </div>
            ) : (
               <>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-slate-400 text-sm mb-2 font-medium">Tamanho</label>
                             <select
                                value={parcelSize}
                                onChange={(e) => setParcelSize(e.target.value as ParcelSize)}
                                className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-yellow-400 focus:outline-none"
                             >
                                 <option value="Pequeno">Pequeno (Envelope/Saco)</option>
                                 <option value="Médio">Médio (Caixa/Mochila)</option>
                                 <option value="Grande">Grande (Mala/Eletro.)</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-slate-400 text-sm mb-2 font-medium">Descrição</label>
                             <input
                               type="text"
                               placeholder="O que está a enviar?"
                               value={parcelDesc}
                               onChange={(e) => setParcelDesc(e.target.value)}
                               className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-yellow-400 focus:outline-none"
                             />
                        </div>
                   </div>
                   <div className="bg-slate-900 p-4 rounded-xl mt-6 border border-slate-700 text-center">
                        <p className="text-yellow-400 text-sm">O preço será definido pelo administrador após a solicitação.</p>
                   </div>
               </>
            )}

            <button
                disabled={!selectedRouteId || !date || (bookingType === 'parcel' && !parcelDesc)}
                onClick={handleBook}
                className="w-full bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 text-slate-900 font-bold py-4 rounded-xl transition-colors mt-2"
            >
                {bookingType === 'passenger' ? 'Continuar para Pagamento' : 'Solicitar Cotação'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
            {history.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    Nenhuma viagem encontrada.
                </div>
            )}
            {history.slice().reverse().map(trip => {
                const r = routes.find(ro => ro.id === trip.routeId);
                const driver = trip.driverId ? allUsers.find(u => u.id === trip.driverId) : null;
                const canCancel = trip.status === 'pending' || trip.status === 'confirmed' || trip.status === 'waiting_quote' || trip.status === 'quote_received';
                
                return (
                    <div key={trip.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${trip.type === 'passenger' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-green-500/20 text-green-500'}`}>
                                        {trip.type === 'passenger' ? 'Viagem' : 'Encomenda'}
                                    </span>
                                    <span className="text-slate-400 text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(trip.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white">{r?.origin} ➔ {r?.destination}</h3>
                                {trip.type === 'parcel' && (
                                    <p className="text-xs text-slate-400 mt-1">Item: {trip.parcelDetails?.description} ({trip.parcelDetails?.size})</p>
                                )}
                            </div>
                            <div className="text-right">
                                 {trip.status === 'waiting_quote' ? (
                                     <p className="text-sm font-bold text-yellow-500 animate-pulse">Aguardando Preço</p>
                                 ) : (
                                     <>
                                        <p className="text-lg font-bold text-white">{trip.totalPrice} MT</p>
                                        <p className="text-xs text-slate-500 mt-1">{trip.paymentMethod || 'Pendente'}</p>
                                     </>
                                 )}
                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className="flex items-center gap-2 mb-4">
                             <span className="text-sm text-slate-400">Estado:</span>
                             <span className={`text-sm font-bold uppercase px-2 py-1 rounded ${
                                 trip.status === 'completed' ? 'bg-green-500 text-slate-900' :
                                 trip.status === 'in-progress' ? 'bg-blue-500 text-white animate-pulse' :
                                 trip.status === 'confirmed' ? 'bg-yellow-400 text-slate-900' :
                                 trip.status === 'quote_received' ? 'bg-blue-500 text-white' :
                                 trip.status === 'cancelled' ? 'bg-red-500 text-white' :
                                 'bg-slate-700 text-slate-300'
                             }`}>
                                 {trip.status === 'pending' ? 'A processar' : 
                                  trip.status === 'waiting_quote' ? 'Análise' :
                                  trip.status === 'quote_received' ? 'Cotação Recebida' :
                                  trip.status === 'confirmed' ? 'Confirmada' : 
                                  trip.status === 'in-progress' ? 'Em Trânsito' : 
                                  trip.status === 'cancelled' ? 'Cancelada' : 'Concluída'}
                             </span>
                        </div>
                        
                        {/* QUOTE ACTION for Parcels */}
                        {trip.status === 'quote_received' && (
                            <div className="bg-slate-900/80 p-3 rounded-lg border border-blue-500/30 mb-4">
                                <p className="text-sm text-white mb-2">Preço definido: <strong className="text-green-400">{trip.totalPrice} MT</strong></p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAcceptQuote(trip.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded"
                                    >
                                        Aceitar e Pagar (M-Pesa)
                                    </button>
                                    <button 
                                        onClick={() => handleCancelTrip(trip.id)}
                                        className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/50 text-xs font-bold py-2 rounded"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DRIVER INFO & CONTACT - Critical Requirement */}
                        {trip.status === 'confirmed' && driver && (
                            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30 mb-4">
                                <p className="text-xs text-green-400 font-bold uppercase mb-2">Motorista Atribuído</p>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-bold text-lg">{driver.name}</p>
                                        <p className="text-slate-400 text-sm uppercase">{driver.vehiclePlate}</p>
                                    </div>
                                    <a href={`tel:${driver.phone}`} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors">
                                        <Phone size={18} />
                                        <span>Ligar</span>
                                    </a>
                                </div>
                                <div className="mt-3 text-xs text-slate-300 bg-slate-900/50 p-2 rounded flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                                    <span>Por favor, entre em contacto com o motorista agora para combinar o local exato de recolha e a hora.</span>
                                </div>
                            </div>
                        )}

                        {/* Passenger Actions (Cancel / Reschedule) */}
                        {canCancel && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                                <button 
                                    onClick={() => handleCancelTrip(trip.id)}
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1"
                                >
                                    <XCircle size={14} /> Cancelar
                                </button>
                                <button 
                                    onClick={() => setRescheduleTripId(trip.id)}
                                    className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-xs font-medium px-2 py-1"
                                >
                                    <RotateCw size={14} /> Adiar/Remarcar
                                </button>
                            </div>
                        )}

                        {/* Trip Progress Actions */}
                        {trip.status === 'confirmed' && (
                            <div className="mt-4">
                                {confirmActionId === `start_${trip.id}` ? (
                                    <div className="flex items-center gap-2 bg-blue-500/20 p-2 rounded-lg border border-blue-500/50 animate-in fade-in">
                                        <AlertTriangle size={16} className="text-blue-400" />
                                        <span className="text-xs text-blue-200">Tem certeza que já está no carro?</span>
                                        <button 
                                            onClick={() => handleStartTrip(trip.id)} 
                                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded ml-auto"
                                        >
                                            Sim, Iniciar
                                        </button>
                                        <button 
                                            onClick={() => setConfirmActionId(null)} 
                                            className="text-slate-400 text-xs hover:text-white px-2"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmActionId(`start_${trip.id}`)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Play size={18} /> Confirmar que a viagem iniciou
                                    </button>
                                )}
                            </div>
                        )}

                         {trip.status === 'in-progress' && (
                             <div className="mt-4">
                                {confirmActionId === `end_${trip.id}` ? (
                                    <div className="flex items-center gap-2 bg-green-500/20 p-2 rounded-lg border border-green-500/50 animate-in fade-in">
                                        <CheckCircle size={16} className="text-green-400" />
                                        <span className="text-xs text-green-200">Já chegou ao destino?</span>
                                        <button 
                                            onClick={() => handleEndTrip(trip.id)} 
                                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded ml-auto"
                                        >
                                            Sim, Cheguei
                                        </button>
                                        <button 
                                            onClick={() => setConfirmActionId(null)} 
                                            className="text-slate-400 text-xs hover:text-white px-2"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmActionId(`end_${trip.id}`)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Flag size={18} /> Confirmar chegada ao destino
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {trip.status === 'completed' && trip.rating && (
                            <div className="mt-2 text-center p-2 bg-slate-900/50 rounded-lg">
                                <div className="flex justify-center text-yellow-400 mb-1">
                                    {[...Array(trip.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {trip.feedbackTags?.map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 relative my-auto">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Pagamento Manual</h3>
                
                {isProcessing ? (
                     <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-300">A registar o seu pedido...</p>
                     </div>
                ) : (
                    <>
                        <div className="bg-slate-900 p-4 rounded-xl mb-4 border border-slate-600">
                             <div className="flex justify-between border-b border-slate-700 pb-2 mb-2">
                                <span className="text-slate-200 font-bold">Total a Transferir</span>
                                <span className="text-yellow-400 font-bold text-lg">{Math.floor(price)} MZN</span>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3 mb-4">
                                <button 
                                    onClick={() => setPaymentMethod('M-Pesa')}
                                    className={`py-2 rounded-lg font-bold text-sm border transition-all ${paymentMethod === 'M-Pesa' ? 'bg-red-600 border-red-500 text-white' : 'bg-transparent border-slate-600 text-slate-400'}`}
                                >
                                    M-Pesa
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('E-Mola')}
                                    className={`py-2 rounded-lg font-bold text-sm border transition-all ${paymentMethod === 'E-Mola' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-slate-600 text-slate-400'}`}
                                >
                                    E-Mola
                                </button>
                             </div>

                             <div className={`p-4 rounded-lg text-center border-2 mb-2 transition-all ${paymentMethod === 'M-Pesa' ? 'bg-red-500/10 border-red-500' : 'bg-purple-500/10 border-purple-500'}`}>
                                 <p className="text-slate-400 text-xs uppercase font-bold mb-1">Transferir para:</p>
                                 <p className="text-2xl font-black text-white tracking-wider">
                                     {paymentMethod === 'M-Pesa' ? '84 456 7470' : '86 067 5792'}
                                 </p>
                                 <p className="text-sm font-bold text-yellow-400 mt-1 mb-1">Estevão Sitefane</p>
                                 <p className="text-xs text-slate-300">GoQuantum (Admin)</p>
                             </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowPayment(false)} className="flex-1 py-3 text-slate-400 font-medium hover:text-white text-sm">Cancelar</button>
                            <button onClick={confirmPayment} className="flex-[2] bg-green-600 text-white font-bold rounded-lg py-3 hover:bg-green-700 shadow-lg text-sm">
                                Já fiz a transferência
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
      
      {/* Reschedule Modal */}
      {rescheduleTripId && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
               <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
                   <h3 className="text-lg font-bold text-white mb-4">Adiar / Remarcar Viagem</h3>
                   <p className="text-xs text-slate-400 mb-4">Escolha uma nova data. O motorista atual será desvinculado e uma nova atribuição será feita pelo administrador.</p>
                   
                   <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-600 mb-4 focus:border-yellow-400"
                   />
                   
                   <div className="flex gap-3">
                        <button onClick={() => setRescheduleTripId(null)} className="flex-1 py-3 text-slate-400 hover:text-white text-sm">Cancelar</button>
                        <button onClick={handleReschedule} disabled={!newDate} className="flex-[2] bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-slate-900 font-bold rounded-lg py-3 text-sm">
                            Confirmar Nova Data
                        </button>
                   </div>
               </div>
          </div>
      )}

      {/* RATING MODAL */}
      {showRatingModal && (
          <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center p-4 z-[60]">
              <div className="bg-slate-800 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-slate-700 animate-in slide-in-from-bottom-10">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                          <CheckCircle size={32} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Chegou ao destino!</h3>
                      <p className="text-slate-400 text-sm mt-1">Como foi a sua viagem?</p>
                  </div>

                  <div className="flex justify-center gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                              key={star}
                              onClick={() => setRating(star)}
                              className="transition-transform hover:scale-110 focus:outline-none"
                          >
                              <Star 
                                  size={32} 
                                  fill={star <= rating ? "#fbbf24" : "none"} 
                                  className={star <= rating ? "text-yellow-400" : "text-slate-600"}
                              />
                          </button>
                      ))}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                      {FEEDBACK_TAGS.map(tag => (
                          <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                  selectedTags.includes(tag) 
                                      ? 'bg-yellow-400 border-yellow-400 text-slate-900' 
                                      : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-400'
                              }`}
                          >
                              {tag}
                          </button>
                      ))}
                  </div>

                  <button 
                      onClick={submitRating}
                      className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl transition-colors shadow-lg"
                  >
                      Enviar Feedback
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};