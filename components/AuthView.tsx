import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser, registerUser } from '../services/mockService';
import { Upload, FileText, User as UserIcon, Phone, CreditCard, Truck, Shield, MessageCircle, Camera } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('passenger');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState(''); // BI for passenger
  const [vehiclePlate, setVehiclePlate] = useState(''); // For driver
  const [licenseFile, setLicenseFile] = useState<string | null>(null); // For driver
  const [profileFile, setProfileFile] = useState<string | null>(null); // For everyone

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // SECURITY CHECK FOR ADMIN
      if (email.trim() === 'goquantum32@gmail.com' && password === 'Nhamposse2004@') {
          // Find the admin user in our mock database
          const adminUser = loginUser('goquantum32@gmail.com');
          if (adminUser) {
              onLogin(adminUser);
              return;
          }
      }

      // Normal Login Flow for others
      const user = loginUser(email);
      
      if (user) {
          // If trying to access admin account without password, block (simple mock check)
          if (user.role === 'admin') {
              alert("Credenciais de administrador inválidas.");
              return;
          }
          onLogin(user);
          return;
      }
      
      alert("Utilizador não encontrado ou palavra-passe incorreta.");
    } else {
      // Registration Logic
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: fullName,
        email,
        phone,
        role,
        profilePhoto: profileFile || undefined,
        idNumber: role === 'passenger' ? idNumber : undefined,
        vehiclePlate: role === 'driver' ? vehiclePlate : undefined,
        licensePhoto: role === 'driver' && licenseFile ? licenseFile : undefined,
        balance: 0
      };
      
      const registeredUser = registerUser(newUser);
      
      if (registeredUser.role === 'driver' && registeredUser.status === 'pending') {
          alert("Registo efetuado! A sua conta de motorista está pendente de aprovação pelo Administrador.");
      }
      
      onLogin(registeredUser);
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseFile(e.target.files[0].name);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          // In a real app, we would upload this. Here we just use the name for mock display.
          // For a better visual mock, we could create a fake URL object.
          setProfileFile(URL.createObjectURL(e.target.files[0])); 
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-10">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-slate-700 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-yellow-400 tracking-tighter mb-2">
            GO<span className="text-white">QUANTUM</span>
          </h1>
          <p className="text-slate-300">Transporte Interprovincial</p>
        </div>
        
        {/* Support Banner */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-600 mb-6 flex items-center justify-center gap-2">
             <MessageCircle className="text-green-500 w-5 h-5" />
             <span className="text-sm font-medium text-slate-300">Suporte WhatsApp: <span className="text-white font-bold">844567470</span></span>
        </div>

        <div className="flex bg-slate-700/50 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isLogin ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isLogin ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Registar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selection for Registration */}
          {!isLogin && (
             <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-2">Eu sou:</label>
                <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${role === 'passenger' ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-slate-900/50 border-slate-600 text-slate-400'}`}>
                        <input type="radio" name="role" checked={role === 'passenger'} onChange={() => setRole('passenger')} className="hidden" />
                        <UserIcon size={18} />
                        <span className="font-bold text-sm">Passageiro</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${role === 'driver' ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-slate-900/50 border-slate-600 text-slate-400'}`}>
                        <input type="radio" name="role" checked={role === 'driver'} onChange={() => setRole('driver')} className="hidden" />
                        <Truck size={18} />
                        <span className="font-bold text-sm">Motorista</span>
                    </label>
                </div>
             </div>
          )}

          {/* Common Fields */}
          {!isLogin && (
            <>
              {/* Profile Picture Input */}
              <div className="flex justify-center mb-4">
                  <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center overflow-hidden">
                          {profileFile ? (
                              <img src={profileFile} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <UserIcon className="w-10 h-10 text-slate-400" />
                          )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full text-slate-900 shadow-lg cursor-pointer hover:bg-yellow-500 transition-colors">
                          <Camera size={16} />
                          <input type="file" onChange={handleProfilePhotoChange} accept="image/*" className="hidden" required={role === 'driver'} />
                      </label>
                  </div>
              </div>
              <p className="text-center text-xs text-slate-400 mb-4">
                  {role === 'driver' ? 'Foto de Perfil (Obrigatória)' : 'Foto de Perfil (Opcional)'}
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500"
                    placeholder="Ex: João Machel"
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contacto (Telemóvel)</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500"
                    placeholder="84 000 0000"
                    />
                </div>
              </div>
            </>
          )}

          {/* Specific Fields: Passenger */}
          {!isLogin && role === 'passenger' && (
             <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Número do BI</label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500"
                    placeholder="1100XXXXN"
                    />
                </div>
             </div>
          )}

          {/* Specific Fields: Driver */}
          {!isLogin && role === 'driver' && (
             <>
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Matrícula do Veículo</label>
                    <div className="relative">
                        <Truck className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500 uppercase"
                        placeholder="ABC-123-MC"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Foto da Carta de Condução</label>
                    <div className="relative border border-dashed border-slate-600 bg-slate-900/50 rounded-lg p-4 text-center hover:bg-slate-900 hover:border-yellow-400 transition-all cursor-pointer group">
                        <input type="file" required onChange={handleLicenseChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                        <div className="flex flex-col items-center justify-center gap-2">
                             {licenseFile ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <FileText size={20} />
                                    <span className="text-sm truncate max-w-[200px]">{licenseFile}</span>
                                </div>
                             ) : (
                                <>
                                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-yellow-400" />
                                    <span className="text-sm text-slate-400">Clique para carregar foto</span>
                                </>
                             )}
                        </div>
                    </div>
                </div>
             </>
          )}

          {/* Login Fields */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500"
              placeholder="seu.email@exemplo.mz"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg transition-colors mt-6 shadow-lg shadow-yellow-400/20"
          >
            {isLogin ? 'Entrar' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
};