import React from 'react';
import AuthForm from '../components/AuthForm';

const Login: React.FC = () => {
  return (
    <div className="login-page">
      <AuthForm isLogin={true} />
    </div>
  );
};

export default Login;