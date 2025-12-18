import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User } from '../types';
import ApiService from '../services/ApiService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await ApiService.getCurrentUser();
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
          token: 'stored', // We don't need to expose the actual token
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting login API call...');
      const { token, user } = await ApiService.login(email, password);
      console.log('AuthContext: API call successful, updating state...');
      setAuthState({
        isAuthenticated: true,
        user,
        token,
      });
      console.log('AuthContext: State updated, isAuthenticated should be true');
    } catch (error) {
      console.error('AuthContext: Login failed', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await ApiService.register(name, email, password);
      // After successful registration, automatically log in
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
