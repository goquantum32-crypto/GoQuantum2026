import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, User as UserIcon, Phone } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen font-sans selection:bg-yellow-400 selection:text-slate-900 relative">
      {/* Global Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/95"></div>
      </div>

      {user && (
        <nav className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40 shadow-lg relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center transform -skew-x-12 shadow-lg shadow-yellow-400/20">
                   <span className="font-bold text-slate-900 transform skew-x-12">Q</span>
                </div>
                <span className="text-xl font-black text-white tracking-tight hidden md:block">
                  GO<span className="text-yellow-400">QUANTUM</span>
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                
                {/* Support Contact (Visible to logged users) */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full border border-slate-600">
                    <Phone size={14} className="text-green-400" />
                    <span className="text-xs font-bold text-slate-300">Suporte: 844567470</span>
                </div>

                <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-bold text-white">{user.name}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-yellow-400 border border-slate-600 overflow-hidden">
                    {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={20} />
                    )}
                </div>
                <button 
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    title="Sair"
                >
                    <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
};