import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

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
    <div className="auth-form">
      <h2>{isLogin ? 'Welcome back' : 'Sign up'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </div>
        <button type="submit" className="submit-btn">
          {isLogin ? 'Continue' : 'Sign up'}
        </button>
      </form>
      <div className="divider">OR</div>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Google Login Failed')}
      />
      <p>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <a href={isLogin ? '/signup' : '/login'}>
          {isLogin ? 'Sign up' : 'Log in'}
        </a>
      </p>
    </div>
  );
};

export default AuthForm;