// src/App.js
import React, { useState } from 'react';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import './styles/main.css'; // Unified and modern styles

const App = () => {
  const [role, setRole] = useState(localStorage.getItem('userRole') || null);

  const handleLogin = (userRole) => {
    setRole(userRole);
    localStorage.setItem('userRole', userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    setRole(null);
  };

  const renderDashboard = () => {
    if (!role) {
      return <Auth onLogin={handleLogin} />;
    }

    return (
      <div className="app-container">
        <header className="header">
          <h1>Employee Survey System ({role.toUpperCase()})</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </header>

        <main className="app-main">
          {role.toLowerCase() === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
        </main>
      </div>
    );
  };

  return <>{renderDashboard()}</>;
};

export default App;
