import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Layout } from './components/Layout';
import { AuthView } from './components/AuthView';
import { PassengerView } from './components/PassengerView';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);

  // Simple session persistence check (mock)
  useEffect(() => {
    const saved = localStorage.getItem('gq_user');
    if (saved) {
      setUser(JSON.parse(saved));
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
