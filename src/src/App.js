import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

const App = () => {
  // Initialize role from localStorage or API on load
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
    console.log(role);
    if (!role) {
      return <Auth onLogin={handleLogin} />;
    }
    
    // Add a header for all logged-in users
    const header = (
        <div className="header">
            <h1>Employee Survey System ({role.toUpperCase()})</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );

    if (role.toLowerCase() === 'admin') {
      return (
        <>
          {header}
          <AdminDashboard />
        </>
      );
    } else if (role.toLowerCase() === 'employee') {
      return (
        <>
          {header}
          <EmployeeDashboard />
        </>
      );
    }
    
    return <Auth onLogin={handleLogin} />; // Fallback
  };

  return (
    <div>
      {renderDashboard()}
    </div>
  );
};

export default App;