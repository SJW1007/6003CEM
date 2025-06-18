//SignUp.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './SignUp.css';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = password => {
    const digitCount = (password.match(/\d/g) || []).length;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return digitCount >= 4 && specialChar;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!validatePassword(formData.password)) {
      return setError("Password must contain at least 4 digits and 1 special character");
    }

    try {
  const res = await fetch('https://six003cem.onrender.com/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password
    })
  });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        navigate('/'); // Redirect to Login page
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup request failed:', err.message);
      setError('Signup request failed');
    }
  };

  return (
    <div className="signup-page">
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="name" type="text" value={formData.name} onChange={handleChange} required />

        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} required />

        <label>Password</label>
        <div className="password-wrapper">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Hide' : 'Show'}
          </span>
        </div>

        <label>Confirm Password</label>
        <div className="password-wrapper">
          <input
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? 'Hide' : 'Show'}
          </span>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit">Sign Up</button>
      </form>
    <div className="login-link">
    <p className="switch-link">
    <Link to="/">  Already have an account? Login here</Link>
    </p>
    </div>
  </div>
    </div>
);
}
