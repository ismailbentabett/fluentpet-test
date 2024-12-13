import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { user, userData, initializing, loading, ...rest } = context;
  
  return {
    user,
    userData,
    initializing,
    loading,
    isAuthenticated: !!user && !!userData,
    ...rest,
  };
};