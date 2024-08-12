import React from 'react';
import AuthForm from '../components/AuthForm';

const Signup: React.FC = () => {
  return (
    <div className="signup-page">
      <AuthForm isLogin={false} />
    </div>
  );
};

export default Signup;