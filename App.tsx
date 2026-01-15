import React, { useState, useEffect } from 'react';
import { User } from './types.ts';
import { Layout } from './components/Layout.tsx';
import { AuthView } from './components/AuthView.tsx';
import { PassengerView } from './components/PassengerView.tsx';
import { DriverDashboard } from './components/DriverDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gq_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar sessão:", e);
      }
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('gq_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gq_user');
  };

  const renderView = () => {
    if (!user) return <AuthView onLogin={handleLogin} />;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'driver':
        return <DriverDashboard user={user} />;
      case 'passenger':
      default:
        return <PassengerView user={user} />;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
}

export default App;