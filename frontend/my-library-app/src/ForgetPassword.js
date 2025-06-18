// ForgetPassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './ForgetPassword.css';

export default function ForgetPassword() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!validatePassword(formData.password)) {
      return setError("Password must contain at least 4 digits and 1 special character");
    }

    try {
      const res = await fetch('https://six003cem.onrender.com/api/forgetpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();
      if (res.ok) {
        window.alert('Password reset successful! You will now be redirected to the login page.');
        navigate('/');
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      console.error('Password reset failed:', err.message);
      setError('Password reset request failed');
    }
  };

  return (
    <div className="forgetpassword-page">
      <div className="forgetpassword-container">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>New Password</label>
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

          <label>Confirm New Password</label>
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
          {success && <p className="success">{success}</p>}

          <button type="submit">Reset Password</button>
        </form>

        <div className="login-link">
          <p className="switch-link">
            <Link to="/">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
