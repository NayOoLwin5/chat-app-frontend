import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthForm.css';

interface AuthFormProps {
  isLogin: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, {
        email,
        password,
        name: isLogin ? undefined : name,
      });
      console.log(response.data);
      if (!isLogin) {
        // If it's a successful registration, redirect to login page
        navigate('/login');
      } else {
        // Handle successful login
        if (response.data.data.token) {
          localStorage.setItem('token', response.data.data.token);
          navigate('/chat');
        } else {
          console.error('Login successful, but no token received');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.get('/auth/google/callback', {
        headers: {
          Authorization: `Bearer ${credentialResponse.credential}`,
        },
      });
      console.log(response.data);
      // Handle successful Google login (e.g., store token, redirect)
    } catch (error) {
      console.error('Google authentication error:', error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">C</div>
          <div className="auth-brand-name">ChatApp</div>
        </div>
        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to continue to your conversations.'
            : 'Sign up to start chatting in seconds.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>
          <button type="submit" className="submit-btn">
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div className="google-wrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log('Google Login Failed')}
            theme="filled_black"
            shape="pill"
            size="large"
          />
        </div>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <a href={isLogin ? '/signup' : '/login'}>
            {isLogin ? 'Sign up' : 'Log in'}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
