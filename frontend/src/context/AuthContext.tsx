import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrMobile: string, pass: string) => Promise<AuthResponse>;
  register: (data: any) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mock_udyam_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mock_udyam_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          localStorage.setItem('mock_udyam_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (emailOrMobile: string, pass: string): Promise<AuthResponse> => {
    const res = await authService.login(emailOrMobile, pass);
    setToken(res.access_token);
    localStorage.setItem('mock_udyam_token', res.access_token);
    
    // Fetch full profile
    const profile = await authService.getCurrentUser();
    setUser(profile);
    localStorage.setItem('mock_udyam_user', JSON.stringify(profile));
    return res;
  };

  const register = async (data: any): Promise<AuthResponse> => {
    const res = await authService.register(data);
    setToken(res.access_token);
    localStorage.setItem('mock_udyam_token', res.access_token);
    
    const profile = await authService.getCurrentUser();
    setUser(profile);
    localStorage.setItem('mock_udyam_user', JSON.stringify(profile));
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mock_udyam_token');
    localStorage.removeItem('mock_udyam_user');
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const profile = await authService.getCurrentUser();
        setUser(profile);
        localStorage.setItem('mock_udyam_user', JSON.stringify(profile));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
