import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css'; // Reusing Login.css for structural consistency

import { useAuth } from '../context/AuthContext';

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 30 C20 30 8 26 8 14 C8 14 14 16 18 24" fill="#22c55e" />
    <path d="M20 30 C20 30 32 26 32 14 C32 14 26 16 22 24" fill="#22c55e" />
    <path d="M20 30 C20 30 14 18 20 8 C26 18 20 30 20 30Z" fill="#16a34a" />
  </svg>
);

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await register({
      email: email,
      full_name: fullName,
      password: password
    });
    
    setIsLoading(false);
    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Background Image with Overlay */}
      <div className="auth-background" style={{ backgroundImage: "url('/images/artisan_hero_clean.png')" }}>
        <div className="auth-overlay"></div>
      </div>

      {/* Authentication Modal */}
      <motion.div
        className="auth-modal"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <LogoIcon />
            <span>ArtisanGPS</span>
          </div>
          <h1 className="auth-title">Create your Artisan<br />marketplace account.</h1>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          {/* Full Name Field */}
          <div className="form-group">
            <label>Full Name</label>
            <div className="phone-input-group">
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label>Email Address</label>
            <div className="phone-input-group">
              <input
                type="email"
                placeholder="e.g. ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>Create Password</label>
            <div className="password-input-group">
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="toggle-password">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          {error && <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center', fontSize: '14px' }}>{error}</p>}
        </form>

        <div className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Login here</Link>
        </div>

        <div className="auth-bottom-links">
          <Link to="#">HELP CENTER</Link>
          <Link to="#">PRIVACY POLICY</Link>
          <Link to="#">ENGLISH (INDIA)</Link>
        </div>
      </motion.div>
    </div>
  );
}
