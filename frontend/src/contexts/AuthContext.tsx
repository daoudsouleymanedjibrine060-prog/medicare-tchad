import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { AUTH_LOGOUT_EVENT } from '../services/api';
import type { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: Role) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
      navigate('/connexion', { replace: true });
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, [navigate]);

  const login = async (email: string, password: string, expectedRole?: Role) => {
    const { data } = await api.post('/auth/login', { email, password, expectedRole });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData: RegisterData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // déconnexion locale même si l'API échoue
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getRoleHomePath(role: Role): string {
  switch (role) {
    case 'PATIENT': return '/patient/dashboard';
    case 'ASSISTANT': return '/assistant/dashboard';
    case 'DOCTOR': return '/doctor/dashboard';
    case 'ADMIN': return '/admin/dashboard';
    case 'SUPER_ADMIN': return '/super-admin/dashboard';
    default: return '/';
  }
}
