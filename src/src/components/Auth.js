import React, { useState } from 'react';
import { loginUser , fetchUserRole} from '../services/api'; // Assume this is implemented

const Auth = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // 1. AWAIT the login: This gets the token and, CRITICALLY, saves it to localStorage inside api.js.
      await loginUser(username, password); 
      
      // 2. AWAIT the role fetch: This uses the token saved in step 1 to call /users/me.
      const userDetails = await fetchUserRole();
      
      // 3. Complete login: Pass the confirmed role to the parent component for redirection.
      onLogin(userDetails.role); 
      
    } catch (err) {
      // Handle API errors gracefully
      setError(err.message || 'Login failed. Please verify your credentials and try again.');
    }
  };

  return (
    <div className="container" style={{maxWidth: '400px', marginTop: '100px', backgroundColor: '#ffffff'}}>
      <h2 style={{backgroundColor: 'dodgerblue', color:'#ffffff' }}>Employee System Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        {error && <p className="message error">{error}</p>}
        <button type="submit" className="primary">Login</button>
      </form>
    </div>
  );
};

export default Auth;