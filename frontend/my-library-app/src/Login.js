//Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('https://six003cem.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      console.log('Login response data:', data);
      
      if (res.ok) {
        alert(data.message);
        
        // Store authentication token and user info
        console.log('Saving userId:', data.userId);
        console.log('Saving token:', data.token);
        
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('token', data.token);
        
        navigate('/home');
      } else {
        setError(data.error || 'Login failed');
      }

    } catch (err) {
      console.error('Login request failed:', err.message);
      setError('Login request failed');
    }
  };

  return (
    <div className="login-background">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Name or Email</label>
          <input
            name="identifier"
            type="text"
            value={formData.identifier}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="forgot-password">
          <Link to="/forgetpassword">Forgot Password?</Link>
        </div>

          <button className="login-button" type="submit">Login</button>
        </form>

        <div className="signup-link">
                  <p className="switch-link">
        <Link to="/signup">Don't have an account? Sign up here</Link>
      </p>

        {error && <p className="error">{error}</p>}

        </div> 
    </div>
  </div>
);
}